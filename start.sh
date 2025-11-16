#!/bin/bash

# WellSchoolToken - Start Script
# Запускает frontend и backend серверы одновременно

echo "🚀 Starting WellSchoolToken servers..."
echo "=================================="

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js"
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Пожалуйста, установите npm"
    exit 1
fi

# Переходим в директорию проекта
cd "$(dirname "$0")"

echo "📦 Checking dependencies..."

# Проверяем установлены ли зависимости в backend
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Проверяем установлены ли зависимости в frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Проверяем установлен ли concurrently
if [ ! -d "node_modules" ]; then
    echo "📥 Installing root dependencies..."
    npm install
fi

echo ""
echo "🎯 Starting servers..."
echo "📍 Backend API will run on: http://localhost:5001"
echo "📍 Frontend will run on: http://localhost:3001"
echo ""
echo "⚠️  Убедитесь, что папка backend/uploads/questions существует для загрузки изображений"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"
echo ""

# Запускаем оба сервера
npm run dev
