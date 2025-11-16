#!/bin/bash

# Скрипт для проверки и создания администратора на сервере

echo "🔍 Проверка администратора..."

cd /var/www/wellschool-token/backend || exit 1

# Проверяем существование базы данных
if [ ! -f "database.sqlite" ]; then
    echo "❌ База данных не найдена. Инициализация..."
    node -e "const { initialize } = require('./config/database'); initialize();"
    sleep 2
fi

# Проверяем существование администратора
node << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Инициализируем базу данных если нужно
const { initialize } = require('./config/database');
initialize();
setTimeout(() => {

// Проверяем существование администратора
db.get('SELECT * FROM admins WHERE email = ?', ['admin@wellschool.com'], (err, admin) => {
  if (err) {
    console.error('Ошибка при проверке администратора:', err);
    db.close();
    process.exit(1);
  }

  if (admin) {
    console.log('✅ Администратор найден:');
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive ? 'Да' : 'Нет');
    
    // Проверяем пароль
    const testPassword = 'admin123';
    bcrypt.compare(testPassword, admin.password, (err, isMatch) => {
      if (err) {
        console.error('Ошибка при проверке пароля:', err);
      } else if (isMatch) {
        console.log('✅ Пароль правильный');
      } else {
        console.log('⚠️  Пароль не совпадает с "admin123"');
        console.log('   Создаем нового администратора...');
        
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run('UPDATE admins SET password = ? WHERE email = ?', [hashedPassword, 'admin@wellschool.com'], (err) => {
          if (err) {
            console.error('Ошибка при обновлении пароля:', err);
          } else {
            console.log('✅ Пароль обновлен');
          }
          db.close();
        });
        return;
      }
      db.close();
    });
  } else {
    console.log('❌ Администратор не найден. Создание...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO admins (username, email, password, fullName, role, isActive) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@wellschool.com', hashedPassword, 'System Administrator', 'super_admin', 1],
      function(err) {
        if (err) {
          console.error('Ошибка при создании администратора:', err);
        } else {
          console.log('✅ Администратор создан:');
          console.log('   Email: admin@wellschool.com');
          console.log('   Password: admin123');
        }
        db.close();
      }
    );
  }
});
}, 1000);
EOF

echo ""
echo "📋 Данные для входа:"
echo "   Email: admin@wellschool.com"
echo "   Password: admin123"

