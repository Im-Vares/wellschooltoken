#!/usr/bin/env node

// Скрипт для исправления дубликатов ачивок и удаления лишних токенов
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initialize } = require('../config/database');

console.log('🔧 Исправление дубликатов ачивок и удаление лишних токенов...\n');

// Инициализируем базу данных
initialize();

setTimeout(() => {
  const dbPath = path.join(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Шаг 1: Проверяем дубликаты в userAchievements (хотя их не должно быть из-за UNIQUE)
    console.log('📊 Проверка дубликатов в userAchievements...');
    
    db.all(`
      SELECT userId, achievementId, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM userAchievements
      GROUP BY userId, achievementId
      HAVING count > 1
    `, [], (err, duplicates) => {
      if (err) {
        console.error('❌ Ошибка при поиске дубликатов:', err);
        processTransactions();
        return;
      }

      if (duplicates.length > 0) {
        console.log(`⚠️  Найдено ${duplicates.length} групп дубликатов в userAchievements (не должно быть!):`);
        duplicates.forEach((dup, index) => {
          console.log(`   ${index + 1}. User ${dup.userId}, Achievement ${dup.achievementId}: ${dup.count} записей`);
        });
        
        // Удаляем дубликаты
        let processed = 0;
        duplicates.forEach((dup) => {
          const ids = dup.ids.split(',').map(id => parseInt(id)).sort((a, b) => a - b);
          const keepId = ids[0];
          const deleteIds = ids.slice(1);
          
          const deleteQuery = `DELETE FROM userAchievements WHERE id IN (${deleteIds.join(',')})`;
          db.run(deleteQuery, [], function(deleteErr) {
            if (deleteErr) {
              console.error(`❌ Ошибка при удалении дубликатов:`, deleteErr);
            } else {
              console.log(`   ✅ Удалено ${this.changes} дубликатов для user ${dup.userId}, achievement ${dup.achievementId}`);
            }
            processed++;
            if (processed === duplicates.length) {
              processTransactions();
            }
          });
        });
      } else {
        console.log('✅ Дубликатов в userAchievements не найдено');
        processTransactions();
      }
    });
  });

  function processTransactions() {
    console.log('\n💰 Поиск дубликатов транзакций токенов...');
    
    // Получаем все транзакции типа 'achievement'
    db.all(`
      SELECT id, userId, amount, reason, createdAt
      FROM tokenTransactions
      WHERE type = 'achievement'
      ORDER BY userId, reason, createdAt
    `, [], (err, transactions) => {
      if (err) {
        console.error('❌ Ошибка при получении транзакций:', err);
        db.close();
        process.exit(1);
      }

      if (transactions.length === 0) {
        console.log('✅ Транзакций типа achievement не найдено');
        recalculateBalances(0);
        return;
      }

      console.log(`   Найдено ${transactions.length} транзакций типа 'achievement'`);

      // Группируем транзакции по пользователю и причине (название ачивки)
      const transactionGroups = {};
      transactions.forEach(tx => {
        const key = `${tx.userId}_${tx.reason}`;
        if (!transactionGroups[key]) {
          transactionGroups[key] = [];
        }
        transactionGroups[key].push(tx);
      });

      // Находим группы с дубликатами
      let transactionsToDelete = [];
      Object.values(transactionGroups).forEach(group => {
        if (group.length > 1) {
          // Сортируем по дате создания
          group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          // Оставляем первую, остальные помечаем на удаление
          transactionsToDelete.push(...group.slice(1));
        }
      });

      if (transactionsToDelete.length === 0) {
        console.log('✅ Лишних транзакций не найдено');
        recalculateBalances(0);
        return;
      }

      console.log(`\n🔍 Найдено ${transactionsToDelete.length} лишних транзакций для удаления:`);
      
      // Группируем для вывода
      const deleteGroups = {};
      transactionsToDelete.forEach(tx => {
        const key = `${tx.userId}_${tx.reason}`;
        if (!deleteGroups[key]) {
          deleteGroups[key] = { user: tx.userId, reason: tx.reason, count: 0, tokens: 0 };
        }
        deleteGroups[key].count++;
        deleteGroups[key].tokens += tx.amount;
      });

      Object.values(deleteGroups).forEach((group, index) => {
        console.log(`   ${index + 1}. User ${group.user}: "${group.reason}" - ${group.count} дубликатов, ${group.tokens} токенов`);
      });

      // Подсчитываем сумму токенов для удаления
      const totalTokensToRemove = transactionsToDelete.reduce((sum, tx) => sum + tx.amount, 0);
      console.log(`\n💰 Всего токенов для удаления: ${totalTokensToRemove}`);

      const deleteTransactionIds = transactionsToDelete.map(tx => tx.id);
      const deleteQuery = `DELETE FROM tokenTransactions WHERE id IN (${deleteTransactionIds.join(',')})`;
      
      console.log('\n🗑️  Удаление лишних транзакций...');
      db.run(deleteQuery, [], function(deleteErr) {
        if (deleteErr) {
          console.error('❌ Ошибка при удалении транзакций:', deleteErr);
          db.close();
          process.exit(1);
        } else {
          console.log(`   ✅ Удалено ${this.changes} лишних транзакций`);
          recalculateBalances(totalTokensToRemove);
        }
      });
    });
  }

  function recalculateBalances(tokensRemoved) {
    console.log('\n🔄 Пересчет балансов пользователей...');

    // Получаем всех пользователей
    db.all('SELECT id, username, tokenBalance FROM users', [], (err, users) => {
      if (err) {
        console.error('❌ Ошибка при получении пользователей:', err);
        db.close();
        process.exit(1);
      }

      let processed = 0;
      let totalAdjusted = 0;
      let usersAdjusted = 0;

      if (users.length === 0) {
        console.log('   Пользователей не найдено');
        finish(tokensRemoved, 0, 0);
        return;
      }

      users.forEach(user => {
        // Подсчитываем правильный баланс на основе всех транзакций
        db.get(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM tokenTransactions
          WHERE userId = ?
        `, [user.id], (err, result) => {
          if (err) {
            console.error(`❌ Ошибка при подсчете баланса для user ${user.id}:`, err);
            processed++;
            if (processed === users.length) {
              finish(tokensRemoved, totalAdjusted, usersAdjusted);
            }
            return;
          }

          const correctBalance = result.total;
          const currentBalance = user.tokenBalance;
          const difference = currentBalance - correctBalance;

          if (Math.abs(difference) > 0.01) { // Учитываем возможные ошибки округления
            // Обновляем баланс
            db.run('UPDATE users SET tokenBalance = ? WHERE id = ?', 
              [correctBalance, user.id], 
              function(updateErr) {
                if (updateErr) {
                  console.error(`❌ Ошибка при обновлении баланса для user ${user.id}:`, updateErr);
                } else {
                  console.log(`   ✅ ${user.username} (ID: ${user.id}): ${currentBalance} → ${correctBalance} (${difference > 0 ? '-' : '+'}${Math.abs(difference)})`);
                  totalAdjusted += Math.abs(difference);
                  usersAdjusted++;
                }

                processed++;
                if (processed === users.length) {
                  finish(tokensRemoved, totalAdjusted, usersAdjusted);
                }
              }
            );
          } else {
            processed++;
            if (processed === users.length) {
              finish(tokensRemoved, totalAdjusted, usersAdjusted);
            }
          }
        });
      });
    });
  }

  function finish(tokensRemoved, totalAdjusted, usersAdjusted) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Исправление завершено!');
    console.log('='.repeat(60));
    console.log(`\n📊 Итоги:`);
    console.log(`   - Удалено лишних транзакций токенов: ${tokensRemoved}`);
    console.log(`   - Пересчитано балансов: ${usersAdjusted} пользователей`);
    console.log(`   - Всего скорректировано токенов: ${totalAdjusted}`);
    console.log('\n');
    
    db.close();
    process.exit(0);
  }
}, 2000);
