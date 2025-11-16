#!/bin/bash

# Скрипт для исправления CORS проблем

echo "🔧 Исправление CORS проблем..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# 1. Обновляем CORS в backend
echo ""
echo "1️⃣ Обновление CORS в backend..."
if [ -f "$BACKEND_DIR/server.js" ]; then
    cd "$BACKEND_DIR"
    
    # Проверяем, есть ли уже настройки CORS
    if grep -q "cors({" server.js; then
        echo "✅ CORS уже настроен"
    else
        # Заменяем app.use(cors()) на app.use(cors({...}))
        sed -i "s/app\.use(cors());/app.use(cors({\n  origin: ['http:\/\/localhost:3001', 'http:\/\/localhost:6385', 'http:\/\/144.31.92.146:6385'],\n  credentials: true\n}));/g" server.js
        echo "✅ CORS обновлен в backend"
    fi
else
    echo "❌ server.js не найден"
fi

# 2. Обновляем frontend .env.local
echo ""
echo "2️⃣ Настройка frontend для работы через Nginx..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # Используем относительный путь для работы через Nginx
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=/api
EOF
    echo "✅ Создан frontend/.env.local с относительным путем"
else
    echo "❌ Директория frontend не найдена"
fi

echo ""
echo "✅ Исправления применены!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Перезапустите backend и frontend"
echo "   2. Проверьте вход администратора в браузере"
echo ""
echo "   Если используете screen:"
echo "   screen -r wellschool"
echo "   Ctrl+C для остановки"
echo "   ./start.sh для перезапуска"

