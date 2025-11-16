#!/usr/bin/env node

// Скрипт для создания/обновления администратора
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { initialize } = require('../backend/config/database');

console.log('🔧 Создание/обновление администратора...');

// Инициализируем базу данных
initialize();

setTimeout(() => {
  const dbPath = path.join(__dirname, '../backend/database.sqlite');
  const db = new sqlite3.Database(dbPath);

  // Проверяем существование администратора
  db.get('SELECT * FROM admins WHERE email = ?', ['admin@wellschool.com'], (err, admin) => {
    if (err) {
      console.error('❌ Ошибка при проверке администратора:', err);
      db.close();
      process.exit(1);
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);

    if (admin) {
      console.log('✅ Администратор найден. Обновление пароля...');
      db.run('UPDATE admins SET password = ?, isActive = 1 WHERE email = ?', 
        [hashedPassword, 'admin@wellschool.com'], 
        function(updateErr) {
          if (updateErr) {
            console.error('❌ Ошибка при обновлении:', updateErr);
          } else {
            console.log('✅ Пароль администратора обновлен');
          }
          db.close();
        }
      );
    } else {
      console.log('❌ Администратор не найден. Создание...');
      db.run(`INSERT INTO admins (username, email, password, fullName, role, isActive) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@wellschool.com', hashedPassword, 'System Administrator', 'super_admin', 1],
        function(insertErr) {
          if (insertErr) {
            console.error('❌ Ошибка при создании:', insertErr);
          } else {
            console.log('✅ Администратор создан успешно');
          }
          db.close();
        }
      );
    }
  });
}, 2000);

