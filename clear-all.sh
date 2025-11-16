#!/bin/bash

# Скрипт для очистки всех пользователей и токенов

echo "🗑️  Очистка всех пользователей и токенов..."
echo "⚠️  ВНИМАНИЕ: Это действие удалит всех пользователей и очистит все токены!"
echo ""
read -p "Вы уверены? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Операция отменена"
    exit 0
fi

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Директория backend не найдена"
    exit 1
fi

cd "$BACKEND_DIR"

# Запускаем скрипт очистки
node scripts/clearUsersAndTokens.js

echo ""
echo "✅ Готово!"

