#!/bin/bash

# Скрипт для исправления дубликатов ачивок и удаления лишних токенов

echo "🔧 Исправление дубликатов ачивок и удаление лишних токенов..."
echo "⚠️  ВНИМАНИЕ: Это действие удалит дубликаты ачивок и пересчитает балансы токенов!"
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

# Запускаем скрипт исправления
node scripts/fixDuplicateAchievements.js

echo ""
echo "✅ Готово!"

