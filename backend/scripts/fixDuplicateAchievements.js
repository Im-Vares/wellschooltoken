#!/usr/bin/env node

// Скрипт для исправления дубликатов ачивок и удаления лишних токенов
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initialize } = require('../config/database');

console.log('🔧 Исправление дубликатов ачивок и удаление лишних токенов...');

// Инициализируем базу данных
initialize();

setTimeout(() => {
  const dbPath = path.join(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Шаг 1: Найти дубликаты в userAchievements
    console.log('\n📊 Поиск дубликатов ачивок...');
    
    db.all(`
      SELECT userId, achievementId, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM userAchievements
      GROUP BY userId, achievementId
      HAVING count > 1
    `, [], (err, duplicates) => {
      if (err) {
        console.error('❌ Ошибка при поиске дубликатов:', err);
        db.close();
        process.exit(1);
      }

      if (duplicates.length === 0) {
        console.log('✅ Дубликатов не найдено');
        db.close();
        process.exit(0);
      }

      console.log(`\n🔍 Найдено ${duplicates.length} групп дубликатов:`);
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. User ${dup.userId}, Achievement ${dup.achievementId}: ${dup.count} записей`);
      });

      // Шаг 2: Для каждой группы дубликатов оставляем только первую запись
      console.log('\n🗑️  Удаление дубликатов...');
      
      let processed = 0;
      let totalDeleted = 0;
      let totalTokensToRemove = 0;

      duplicates.forEach((dup, index) => {
        const ids = dup.ids.split(',').map(id => parseInt(id)).sort((a, b) => a - b);
        const keepId = ids[0]; // Оставляем первую запись
        const deleteIds = ids.slice(1); // Удаляем остальные

        // Получаем информацию об ачивке для расчета токенов
        db.get('SELECT tokensReward FROM achievements WHERE id = ?', [dup.achievementId], (err, achievement) => {
          if (err) {
            console.error(`❌ Ошибка при получении информации об ачивке ${dup.achievementId}:`, err);
            processed++;
            if (processed === duplicates.length) {
              finishCleanup();
            }
            return;
          }

          const tokensPerDuplicate = achievement ? achievement.tokensReward : 0;
          const tokensToRemove = tokensPerDuplicate * deleteIds.length;
          totalTokensToRemove += tokensToRemove;

          // Удаляем дубликаты
          const deleteQuery = `DELETE FROM userAchievements WHERE id IN (${deleteIds.join(',')})`;
          db.run(deleteQuery, [], function(deleteErr) {
            if (deleteErr) {
              console.error(`❌ Ошибка при удалении дубликатов для user ${dup.userId}, achievement ${dup.achievementId}:`, deleteErr);
            } else {
              console.log(`   ✅ Удалено ${this.changes} дубликатов для user ${dup.userId}, achievement ${dup.achievementId}`);
              totalDeleted += this.changes;
            }

            processed++;
            if (processed === duplicates.length) {
              finishCleanup();
            }
          });
        });
      });

      function finishCleanup() {
        console.log(`\n✅ Удалено ${totalDeleted} дубликатов записей ачивок`);

        // Шаг 3: Удаляем лишние транзакции токенов от дубликатов
        console.log('\n💰 Удаление лишних транзакций токенов...');
        
        // Получаем все транзакции типа 'achievement'
        db.all(`
          SELECT id, userId, amount, reason, createdAt
          FROM tokenTransactions
          WHERE type = 'achievement'
          ORDER BY userId, reason, createdAt
        `, [], (err, transactions) => {
          if (err) {
            console.error('❌ Ошибка при получении транзакций:', err);
            recalculateBalances();
            return;
          }

          if (transactions.length === 0) {
            console.log('✅ Транзакций типа achievement не найдено');
            recalculateBalances();
            return;
          }

          // Группируем транзакции по пользователю и причине (название ачивки)
          const transactionGroups = {};
          transactions.forEach(tx => {
            const key = `${tx.userId}_${tx.reason}`;
            if (!transactionGroups[key]) {
              transactionGroups[key] = [];
            }
            transactionGroups[key].push(tx);
          });

          // Для каждой группы оставляем только первую транзакцию
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
            recalculateBalances();
            return;
          }

          console.log(`   Найдено ${transactionsToDelete.length} лишних транзакций для удаления`);

          // Подсчитываем сумму токенов для удаления
          const tokensToRemove = transactionsToDelete.reduce((sum, tx) => sum + tx.amount, 0);
          console.log(`   💰 Всего токенов для удаления: ${tokensToRemove}`);
          totalTokensToRemove = tokensToRemove;

          const deleteTransactionIds = transactionsToDelete.map(tx => tx.id);
          const deleteQuery = `DELETE FROM tokenTransactions WHERE id IN (${deleteTransactionIds.join(',')})`;
          
          db.run(deleteQuery, [], function(deleteErr) {
            if (deleteErr) {
              console.error('❌ Ошибка при удалении транзакций:', deleteErr);
            } else {
              console.log(`   ✅ Удалено ${this.changes} лишних транзакций`);
            }

            recalculateBalances();
          });
        });
      }

      function recalculateBalances() {
        console.log('\n🔄 Пересчет балансов пользователей...');

        if (totalTokensToRemove === 0) {
          console.log('   Нет токенов для удаления, балансы не требуют изменений');
          finish();
          return;
        }

        // Пересчитываем балансы на основе всех оставшихся транзакций
        db.all('SELECT id FROM users', [], (err, users) => {
            if (err) {
              console.error('❌ Ошибка при получении пользователей:', err);
              finish();
              return;
            }

            let processed = 0;
            let totalAdjusted = 0;

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
                    finish();
                  }
                  return;
                }

                const correctBalance = result.total;

                // Получаем текущий баланс
                db.get('SELECT tokenBalance FROM users WHERE id = ?', [user.id], (err, userData) => {
                  if (err) {
                    console.error(`❌ Ошибка при получении баланса для user ${user.id}:`, err);
                    processed++;
                    if (processed === users.length) {
                      finish();
                    }
                    return;
                  }

                  const currentBalance = userData.tokenBalance;
                  const difference = currentBalance - correctBalance;

                  if (Math.abs(difference) > 0.01) { // Учитываем возможные ошибки округления
                    // Обновляем баланс
                    db.run('UPDATE users SET tokenBalance = ? WHERE id = ?', 
                      [correctBalance, user.id], 
                      function(updateErr) {
                        if (updateErr) {
                          console.error(`❌ Ошибка при обновлении баланса для user ${user.id}:`, updateErr);
                        } else {
                          console.log(`   ✅ User ${user.id}: ${currentBalance} → ${correctBalance} (изменение: ${difference > 0 ? '-' : '+'}${Math.abs(difference)})`);
                          totalAdjusted += Math.abs(difference);
                        }

                        processed++;
                        if (processed === users.length) {
                          finish();
                        }
                      }
                    );
                  } else {
                    processed++;
                    if (processed === users.length) {
                      finish();
                    }
                  }
                });
              });
            });
          });
      }

      function finish() {
        console.log('\n✅ Исправление завершено!');
        console.log(`\n📊 Итоги:`);
        console.log(`   - Удалено дубликатов записей: ${totalDeleted}`);
        console.log(`   - Удалено лишних токенов: ${totalTokensToRemove}`);
        
        db.close();
        process.exit(0);
      }
    });
  });
}, 2000);

