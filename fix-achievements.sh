#!/bin/bash

# Скрипт для исправления дубликатов ачивок и удаления лишних токенов

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Директория backend не найдена"
    exit 1
fi

cd "$BACKEND_DIR"

# Сначала проверяем текущее состояние
echo "🔍 Проверка текущего состояния..."
echo ""
node scripts/checkDuplicateAchievements.js

echo ""
echo "=" | head -c 60
echo ""
echo "🔧 Исправление дубликатов ачивок и удаление лишних токенов..."
echo "⚠️  ВНИМАНИЕ: Это действие удалит дубликаты ачивок и пересчитает балансы токенов!"
echo ""
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Операция отменена"
    exit 0
fi

echo ""
echo "🚀 Запуск исправления..."
echo ""

# Запускаем скрипт исправления
node scripts/fixDuplicateAchievements.js

echo ""
echo "✅ Готово!"

