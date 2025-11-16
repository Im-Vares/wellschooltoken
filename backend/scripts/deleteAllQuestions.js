const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { db, initialize } = require('../config/database');

console.log('🗑️  Удаление всех вопросов из базы данных...');

// Initialize database first to ensure tables exist
initialize();

// Wait a bit for initialization
setTimeout(() => {
  // Get all questions with images first
  db.all('SELECT id, imageUrl FROM questions', [], (err, questions) => {
    if (err) {
      console.error('Ошибка при получении вопросов:', err);
      db.close();
      return;
    }

    console.log(`Найдено вопросов: ${questions.length}`);

    // Delete image files
    let deletedImages = 0;
    questions.forEach(question => {
      if (question.imageUrl) {
        const imagePath = path.join(__dirname, '../../', question.imageUrl);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            deletedImages++;
          } catch (fileErr) {
            console.error(`Ошибка при удалении файла ${imagePath}:`, fileErr.message);
          }
        }
      }
    });

    if (deletedImages > 0) {
      console.log(`Удалено файлов изображений: ${deletedImages}`);
    }

    // Delete all questions from database
    db.run('DELETE FROM questions', function(deleteErr) {
      if (deleteErr) {
        console.error('Ошибка при удалении вопросов:', deleteErr);
        db.close();
        return;
      }

      console.log(`✅ Успешно удалено вопросов: ${this.changes}`);
      console.log('✅ Все вопросы удалены из базы данных');
      db.close();
    });
  });
}, 1000);

