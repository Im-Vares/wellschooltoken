#!/bin/bash

# Скрипт для исправления настроек API в frontend

echo "🔧 Исправление настроек API в frontend..."

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Директория frontend не найдена"
    exit 1
fi

cd "$FRONTEND_DIR"

# Создаем/обновляем .env.local
echo ""
echo "📋 Настройка переменных окружения..."

# Определяем API URL
if [ -f "../.env" ] && grep -q "NEXT_PUBLIC_API_URL" ../.env; then
    API_URL=$(grep "NEXT_PUBLIC_API_URL" ../.env | cut -d'=' -f2 | tr -d ' ')
    echo "   Найден API URL в .env: $API_URL"
else
    API_URL="http://localhost:5001/api"
    echo "   Используется стандартный API URL: $API_URL"
fi

# Создаем .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
EOF

echo "✅ Создан frontend/.env.local"
echo "   NEXT_PUBLIC_API_URL=$API_URL"

# Проверяем next.config.js
echo ""
echo "📋 Проверка next.config.js..."
if [ -f "next.config.js" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" next.config.js; then
        echo "✅ next.config.js содержит настройки API"
    else
        echo "⚠️  next.config.js не содержит NEXT_PUBLIC_API_URL"
    fi
else
    echo "❌ next.config.js не найден"
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Перезапустите frontend (если запущен)"
echo "   2. Проверьте в браузере консоль разработчика (F12)"
echo "   3. Проверьте Network tab для запросов к /api/auth/admin/login"

