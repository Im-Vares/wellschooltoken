#!/bin/bash

# Скрипт для исправления проблемы с портом 3000 на сервере

echo "🔧 Исправление проблемы с портом..."

# Остановка процессов на порту 3000
echo "Остановка процессов на порту 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Остановка всех процессов Node.js (опционально, будьте осторожны)
# pkill -f "node.*3000" 2>/dev/null || true

echo "✅ Порт 3000 освобожден"
echo ""
echo "Теперь используйте порт 3001 для frontend:"
echo "1. Обновите ecosystem.config.js: PORT=3001"
echo "2. Обновите nginx.conf: proxy_pass http://localhost:3001"
echo "3. Перезапустите: pm2 restart all && sudo systemctl reload nginx"

