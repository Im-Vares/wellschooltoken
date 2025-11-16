#!/usr/bin/env node

// Скрипт для очистки токенов и удаления всех пользователей
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initialize } = require('../config/database');

console.log('🗑️  Очистка пользователей и токенов...');

// Инициализируем базу данных
initialize();

setTimeout(() => {
  const dbPath = path.join(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(dbPath);

  // Шаг 1: Очистка токенов у всех пользователей
  console.log('📊 Очистка токенов у всех пользователей...');
  db.run('UPDATE users SET tokenBalance = 0', function(err) {
    if (err) {
      console.error('❌ Ошибка при очистке токенов:', err);
    } else {
      console.log(`✅ Токены очищены у ${this.changes} пользователей`);
    }

    // Шаг 2: Удаление всех пользователей
    console.log('🗑️  Удаление всех пользователей...');
    
    // Сначала удаляем связанные записи
    db.serialize(() => {
      // Удаляем записи из userAchievements
      db.run('DELETE FROM userAchievements', function(err) {
        if (err) {
          console.error('❌ Ошибка при удалении userAchievements:', err);
        } else {
          console.log(`✅ Удалено ${this.changes} записей из userAchievements`);
        }
      });

      // Удаляем записи из tokenTransactions
      db.run('DELETE FROM tokenTransactions', function(err) {
        if (err) {
          console.error('❌ Ошибка при удалении tokenTransactions:', err);
        } else {
          console.log(`✅ Удалено ${this.changes} записей из tokenTransactions`);
        }
      });

      // Удаляем записи из submissions
      db.run('DELETE FROM submissions', function(err) {
        if (err) {
          console.error('❌ Ошибка при удалении submissions:', err);
        } else {
          console.log(`✅ Удалено ${this.changes} записей из submissions`);
        }
      });

      // Удаляем всех пользователей
      db.run('DELETE FROM users', function(err) {
        if (err) {
          console.error('❌ Ошибка при удалении пользователей:', err);
        } else {
          console.log(`✅ Удалено ${this.changes} пользователей`);
        }

        // Проверяем результат
        db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
          if (err) {
            console.error('❌ Ошибка при проверке:', err);
          } else {
            console.log(`📊 Осталось пользователей: ${row.count}`);
          }

          db.close();
          console.log('✅ Очистка завершена!');
          process.exit(0);
        });
      });
    });
  });
}, 2000);

