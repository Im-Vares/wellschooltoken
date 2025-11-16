#!/usr/bin/env node

// Скрипт для создания/обновления администратора
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Определяем путь к backend
const scriptDir = __dirname;
const projectRoot = path.join(scriptDir, '..');
const backendDir = path.join(projectRoot, 'backend');

// Если не найдено, пробуем стандартный путь
const finalBackendDir = fs.existsSync(backendDir) ? backendDir : '/var/www/wellschool-token/backend';

if (!fs.existsSync(finalBackendDir)) {
  console.error('❌ Директория backend не найдена!');
  console.error('   Искали в:', finalBackendDir);
  process.exit(1);
}

process.chdir(finalBackendDir);
console.log('📁 Рабочая директория:', process.cwd());

const { initialize } = require('./config/database');

console.log('🔧 Создание/обновление администратора...');

// Инициализируем базу данных
initialize();

setTimeout(() => {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
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

