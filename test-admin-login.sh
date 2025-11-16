#!/bin/bash

# Скрипт для тестирования входа администратора

echo "🧪 Тестирование входа администратора..."

API_URL="${API_URL:-http://localhost:5001/api}"

echo "📡 API URL: $API_URL"
echo ""

# Тест 1: Health check
echo "1️⃣ Проверка доступности backend..."
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend доступен"
else
    echo "❌ Backend недоступен (HTTP $HTTP_CODE)"
    echo "   Проверьте, что backend запущен"
    exit 1
fi

echo ""

# Тест 2: Попытка входа
echo "2️⃣ Тест входа администратора..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@wellschool.com",
    "password": "admin123"
  }' 2>&1)

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

echo "HTTP код: $LOGIN_HTTP_CODE"
echo "Ответ: $LOGIN_BODY"

if [ "$LOGIN_HTTP_CODE" = "200" ]; then
    echo "✅ Вход успешен!"
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "   Токен получен: ${TOKEN:0:30}..."
    fi
else
    echo "❌ Вход не удался"
    echo ""
    echo "Возможные причины:"
    echo "  1. Неправильный пароль в базе данных"
    echo "  2. Администратор неактивен (isActive = 0)"
    echo "  3. Проблема с хешированием пароля"
    echo ""
    echo "Решение:"
    echo "  node deploy/create-admin.js"
fi

echo ""
echo "📋 Проверка администратора в базе данных:"
cd backend 2>/dev/null || cd ~/wellschooltoken/backend 2>/dev/null || {
    echo "❌ Не могу найти директорию backend"
    exit 1
}

node << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('database.sqlite');

db.get('SELECT * FROM admins WHERE email = ?', ['admin@wellschool.com'], (err, admin) => {
  if (err) {
    console.error('Ошибка:', err);
    process.exit(1);
  }
  
  if (admin) {
    console.log('✅ Администратор найден:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Is Active:', admin.isActive);
    console.log('   Role:', admin.role);
    
    // Проверяем пароль
    const testPassword = 'admin123';
    const isMatch = bcrypt.compareSync(testPassword, admin.password);
    console.log('   Пароль совпадает:', isMatch ? '✅ Да' : '❌ Нет');
    
    if (!isMatch) {
      console.log('');
      console.log('⚠️  Пароль не совпадает! Обновите пароль:');
      console.log('   node deploy/create-admin.js');
    }
  } else {
    console.log('❌ Администратор не найден');
    console.log('   Создайте его: node deploy/create-admin.js');
  }
  
  db.close();
});
EOF

