const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { db, initialize } = require('../config/database');

console.log('🔍 Поиск и удаление дубликатов достижений...');

// Initialize database first
initialize();

setTimeout(() => {
  // Find duplicate achievements based on name
  db.all(`
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM achievements
    GROUP BY name
    HAVING count > 1
  `, [], (err, duplicates) => {
    if (err) {
      console.error('Ошибка при поиске дубликатов:', err);
      db.close();
      return;
    }

    if (duplicates.length === 0) {
      console.log('✅ Дубликатов не найдено');
      db.close();
      return;
    }

    console.log(`Найдено ${duplicates.length} групп дубликатов:`);
    
    let totalDeleted = 0;
    let processed = 0;

    duplicates.forEach((duplicate, index) => {
      const ids = duplicate.ids.split(',').map(id => parseInt(id));
      // Keep the first one (lowest ID), delete the rest
      const idsToDelete = ids.slice(1);
      
      console.log(`\nГруппа ${index + 1}: "${duplicate.name}"`);
      console.log(`  Всего: ${duplicate.count}`);
      console.log(`  Оставляем ID: ${ids[0]}`);
      console.log(`  Удаляем ID: ${idsToDelete.join(', ')}`);

      // Check if any of the achievements to delete are linked to users
      db.all(`
        SELECT achievementId, COUNT(*) as userCount
        FROM userAchievements
        WHERE achievementId IN (${idsToDelete.join(',')})
        GROUP BY achievementId
      `, [], (err, linkedAchievements) => {
        if (err) {
          console.error(`Ошибка при проверке связей для "${duplicate.name}":`, err);
          processed++;
          if (processed === duplicates.length) {
            console.log(`\n✅ Обработка завершена. Удалено достижений: ${totalDeleted}`);
            db.close();
          }
          return;
        }

        if (linkedAchievements.length > 0) {
          console.log(`  ⚠️  Предупреждение: Некоторые достижения связаны с пользователями:`);
          linkedAchievements.forEach(linked => {
            console.log(`    ID ${linked.achievementId}: ${linked.userCount} пользователей`);
          });
          
          // Update userAchievements to point to the kept achievement
          // Only update if user doesn't already have the kept achievement
          idsToDelete.forEach(idToDelete => {
            db.run(`
              UPDATE userAchievements
              SET achievementId = ?
              WHERE achievementId = ?
              AND userId NOT IN (
                SELECT userId FROM userAchievements WHERE achievementId = ? AND userId = userAchievements.userId
              )
            `, [ids[0], idToDelete, ids[0]], (err) => {
              if (err) {
                // If update fails (user already has the achievement), just delete the duplicate link
                db.run(`
                  DELETE FROM userAchievements
                  WHERE achievementId = ?
                `, [idToDelete], (delErr) => {
                  if (delErr) {
                    console.error(`Ошибка при удалении связи для ID ${idToDelete}:`, delErr);
                  }
                });
              }
            });
          });
        }

        // Delete duplicate achievements
        db.run(`
          DELETE FROM achievements
          WHERE id IN (${idsToDelete.join(',')})
        `, [], function(deleteErr) {
          if (deleteErr) {
            console.error(`Ошибка при удалении дубликатов для "${duplicate.name}":`, deleteErr);
          } else {
            totalDeleted += this.changes;
            console.log(`  ✅ Удалено: ${this.changes} достижений`);
          }

          processed++;
          if (processed === duplicates.length) {
            console.log(`\n✅ Обработка завершена. Удалено достижений: ${totalDeleted}`);
            db.close();
          }
        });
      });
    });
  });
}, 1000);

