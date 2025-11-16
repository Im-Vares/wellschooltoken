#!/bin/bash

# Скрипт для исправления ошибки 502 Bad Gateway

echo "🔧 Исправление ошибки 502 Bad Gateway..."

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка PM2 процессов
echo -e "${YELLOW}Шаг 1: Проверка PM2 процессов...${NC}"
pm2 status

# Проверка портов
echo -e "\n${YELLOW}Шаг 2: Проверка портов...${NC}"
echo "Порт 3001 (frontend):"
lsof -ti:3001 && echo "✅ Порт 3001 занят" || echo "❌ Порт 3001 свободен"

echo "Порт 5001 (backend):"
lsof -ti:5001 && echo "✅ Порт 5001 занят" || echo "❌ Порт 5001 свободен"

echo "Порт 6385 (nginx):"
lsof -ti:6385 && echo "✅ Порт 6385 занят" || echo "❌ Порт 6385 свободен"

# Проверка конфигурации Nginx
echo -e "\n${YELLOW}Шаг 3: Проверка конфигурации Nginx...${NC}"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Конфигурация Nginx корректна"
else
    echo "❌ Ошибка в конфигурации Nginx:"
    sudo nginx -t
fi

# Проверка доступности приложений
echo -e "\n${YELLOW}Шаг 4: Проверка доступности приложений...${NC}"
echo "Frontend (localhost:3001):"
curl -s http://localhost:3001 > /dev/null && echo "✅ Frontend доступен" || echo "❌ Frontend недоступен"

echo "Backend (localhost:5001/api/health):"
curl -s http://localhost:5001/api/health > /dev/null && echo "✅ Backend доступен" || echo "❌ Backend недоступен"

# Перезапуск приложений
echo -e "\n${YELLOW}Шаг 5: Перезапуск приложений...${NC}"
APP_DIR="/var/www/wellschool-token"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    
    # Остановка всех процессов
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Убить процессы на портах если они есть
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    
    # Запуск через ecosystem.config.js
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ Приложения запущены через PM2"
    else
        echo "❌ Файл ecosystem.config.js не найден"
        echo "   Создайте его или запустите deploy.sh"
    fi
else
    echo "❌ Директория $APP_DIR не найдена"
fi

# Перезагрузка Nginx
echo -e "\n${YELLOW}Шаг 6: Перезагрузка Nginx...${NC}"
sudo systemctl reload nginx
echo "✅ Nginx перезагружен"

# Финальная проверка
echo -e "\n${YELLOW}Шаг 7: Финальная проверка...${NC}"
sleep 3
pm2 status
echo ""
echo "Проверка доступности:"
curl -s http://localhost:6385 > /dev/null && echo "✅ Приложение доступно на порту 6385" || echo "❌ Приложение недоступно"

echo -e "\n${GREEN}Готово! Проверьте логи:${NC}"
echo "  pm2 logs"
echo "  sudo tail -f /var/log/nginx/error.log"

