#!/usr/bin/env node

// Скрипт для проверки дубликатов ачивок
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initialize } = require('../config/database');

console.log('🔍 Проверка дубликатов ачивок и транзакций...\n');

initialize();

setTimeout(() => {
  const dbPath = path.join(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(dbPath);

  // Проверка дубликатов в userAchievements
  db.all(`
    SELECT userId, achievementId, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM userAchievements
    GROUP BY userId, achievementId
    HAVING count > 1
  `, [], (err, duplicates) => {
    if (err) {
      console.error('❌ Ошибка:', err);
      db.close();
      process.exit(1);
    }

    if (duplicates.length > 0) {
      console.log(`⚠️  Найдено ${duplicates.length} групп дубликатов в userAchievements:`);
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. User ${dup.userId}, Achievement ${dup.achievementId}: ${dup.count} записей (IDs: ${dup.ids})`);
      });
    } else {
      console.log('✅ Дубликатов в userAchievements не найдено');
    }

    // Проверка дубликатов транзакций
    db.all(`
      SELECT userId, reason, COUNT(*) as count, SUM(amount) as totalTokens, GROUP_CONCAT(id) as ids
      FROM tokenTransactions
      WHERE type = 'achievement'
      GROUP BY userId, reason
      HAVING count > 1
      ORDER BY userId, reason
    `, [], (err, txDuplicates) => {
      if (err) {
        console.error('❌ Ошибка:', err);
        db.close();
        process.exit(1);
      }

      if (txDuplicates.length > 0) {
        console.log(`\n⚠️  Найдено ${txDuplicates.length} групп дубликатов транзакций:`);
        txDuplicates.forEach((dup, index) => {
          console.log(`   ${index + 1}. User ${dup.userId}: "${dup.reason}"`);
          console.log(`      - Количество: ${dup.count} транзакций`);
          console.log(`      - Всего токенов: ${dup.totalTokens}`);
          console.log(`      - IDs: ${dup.ids}`);
        });
        
        const totalExtraTokens = txDuplicates.reduce((sum, dup) => {
          // Первая транзакция - правильная, остальные - лишние
          const tokensPerTx = dup.totalTokens / dup.count;
          const extraCount = dup.count - 1;
          return sum + (tokensPerTx * extraCount);
        }, 0);
        
        console.log(`\n💰 Всего лишних токенов: ${Math.round(totalExtraTokens)}`);
      } else {
        console.log('\n✅ Дубликатов транзакций не найдено');
      }

      // Показываем статистику по пользователям
      db.all(`
        SELECT u.id, u.username, u.tokenBalance,
               COUNT(DISTINCT ua.id) as achievementsCount,
               COUNT(DISTINCT CASE WHEN tt.type = 'achievement' THEN tt.id END) as achievementTxCount,
               COALESCE(SUM(CASE WHEN tt.type = 'achievement' THEN tt.amount ELSE 0 END), 0) as achievementTokens
        FROM users u
        LEFT JOIN userAchievements ua ON u.id = ua.userId
        LEFT JOIN tokenTransactions tt ON u.id = tt.userId
        GROUP BY u.id
        ORDER BY u.tokenBalance DESC
        LIMIT 10
      `, [], (err, stats) => {
        if (err) {
          console.error('❌ Ошибка:', err);
          db.close();
          process.exit(1);
        }

        console.log('\n📊 Топ пользователей по балансу токенов:');
        stats.forEach((stat, index) => {
          console.log(`   ${index + 1}. ${stat.username} (ID: ${stat.id})`);
          console.log(`      - Баланс: ${stat.tokenBalance} токенов`);
          console.log(`      - Ачивок: ${stat.achievementsCount}`);
          console.log(`      - Транзакций achievement: ${stat.achievementTxCount}`);
          console.log(`      - Токенов от ачивок: ${stat.achievementTokens}`);
        });

        db.close();
        process.exit(0);
      });
    });
  });
}, 2000);

