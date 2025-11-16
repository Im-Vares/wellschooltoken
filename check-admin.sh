#!/bin/bash

# Скрипт для проверки и создания администратора

echo "🔍 Проверка администратора..."

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Директория backend не найдена"
    exit 1
fi

cd "$BACKEND_DIR"

# Проверяем наличие базы данных
if [ ! -f "database.sqlite" ]; then
    echo "📋 База данных не найдена. Инициализация..."
    node -e "const { initialize } = require('./config/database'); initialize(); setTimeout(() => process.exit(0), 2000);"
fi

# Проверяем наличие администратора
echo ""
echo "🔍 Проверка администратора в базе данных..."
node << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get('SELECT * FROM admins WHERE email = ?', ['admin@wellschool.com'], (err, admin) => {
  if (err) {
    console.error('Ошибка:', err);
    process.exit(1);
  }
  
  if (admin) {
    console.log('✅ Администратор найден:');
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Full Name:', admin.fullName);
    console.log('   Is Active:', admin.isActive);
  } else {
    console.log('❌ Администратор не найден');
    console.log('   Создайте его с помощью: node deploy/create-admin.js');
  }
  
  db.close();
});
EOF

echo ""
echo "📋 Для создания/обновления администратора выполните:"
echo "   node deploy/create-admin.js"
echo ""
echo "   Или из корня проекта:"
echo "   cd ~/wellschooltoken && node deploy/create-admin.js"

