#!/bin/bash

# Скрипт для развертывания WellSchool Token на VPS Ubuntu 22.04
# Использование: ./deploy.sh

set -e

echo "🚀 Начало развертывания WellSchool Token..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Переменные
APP_NAME="wellschool-token"
APP_DIR="/var/www/$APP_NAME"
APP_PORT=6385
BACKEND_PORT=5001
FRONTEND_PORT=3001
NODE_VERSION="18.x"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Пожалуйста, запустите скрипт с правами root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}Шаг 1: Обновление системы...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Шаг 2: Установка необходимых пакетов...${NC}"
apt install -y curl wget git build-essential sqlite3

echo -e "${GREEN}Шаг 3: Установка Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}Node.js версия: $(node -v)${NC}"
echo -e "${GREEN}npm версия: $(npm -v)${NC}"

echo -e "${GREEN}Шаг 4: Установка PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo -e "${GREEN}Шаг 5: Создание директории приложения...${NC}"
mkdir -p $APP_DIR

echo -e "${GREEN}Шаг 6: Поиск и копирование файлов проекта...${NC}"

# Функция для поиска корневой директории проекта
find_project_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/package.json" ] && [ -d "$dir/backend" ] && [ -d "$dir/frontend" ]; then
            echo "$dir"
            return 0
        fi
        dir=$(dirname "$dir")
    done
    return 1
}

# Определяем текущую директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Ищем корень проекта, начиная с директории скрипта
PROJECT_ROOT=$(find_project_root "$SCRIPT_DIR")

# Проверяем, есть ли проект в нужной директории
if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/package.json" ] && [ -d "$APP_DIR/backend" ] && [ -d "$APP_DIR/frontend" ]; then
    echo -e "${GREEN}Проект уже находится в $APP_DIR${NC}"
    cd $APP_DIR
    if [ -d ".git" ]; then
        echo -e "${GREEN}Обновление из git...${NC}"
        git pull || true
    fi
elif [ -n "$PROJECT_ROOT" ] && [ "$PROJECT_ROOT" != "$APP_DIR" ]; then
    # Найден проект в другой директории, копируем
    echo -e "${GREEN}Проект найден в $PROJECT_ROOT, копируем в $APP_DIR...${NC}"
    mkdir -p $APP_DIR
    # Копируем все файлы, исключая node_modules и .git
    if command -v rsync &> /dev/null; then
        rsync -av --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='database.sqlite' "$PROJECT_ROOT/" "$APP_DIR/" 2>/dev/null
    else
        echo -e "${YELLOW}rsync не найден, используем cp...${NC}"
        cd "$PROJECT_ROOT"
        cp -r backend frontend deploy package.json package-lock.json start.sh README.md DEPLOYMENT.md $APP_DIR/ 2>/dev/null || true
    fi
    cd $APP_DIR
    echo -e "${GREEN}Проект скопирован в $APP_DIR${NC}"
elif [ -d "$APP_DIR/.git" ]; then
    echo -e "${GREEN}Найден git репозиторий в $APP_DIR, обновляем...${NC}"
    cd $APP_DIR
    git pull || true
else
    echo -e "${RED}Проект не найден!${NC}"
    echo -e "${YELLOW}Пожалуйста, выполните одно из следующих действий:${NC}"
    echo -e "${YELLOW}1. Загрузите файлы проекта в $APP_DIR${NC}"
    echo -e "${YELLOW}2. Используйте git clone: git clone <repository> $APP_DIR${NC}"
    echo -e "${YELLOW}3. Запустите скрипт из директории проекта или его поддиректории${NC}"
    exit 1
fi

echo -e "${GREEN}Шаг 7: Установка зависимостей...${NC}"
if [ -f "package.json" ]; then
    npm install
fi

if [ -d "backend" ]; then
    cd backend
    npm install
    cd ..
fi

if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
fi

echo -e "${GREEN}Шаг 8: Настройка переменных окружения...${NC}"
  if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << EOF
# Backend
NODE_ENV=production
PORT=$BACKEND_PORT
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api
PORT=$FRONTEND_PORT
EOF
    echo -e "${GREEN}Создан файл .env${NC}"
  else
    echo -e "${YELLOW}Файл .env уже существует${NC}"
  fi

  # Создаем .env.local для frontend (Next.js использует этот файл)
  if [ -d "$APP_DIR/frontend" ]; then
    cat > $APP_DIR/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api
EOF
    echo -e "${GREEN}Создан frontend/.env.local${NC}"
    
    # Также создаем .env.production
    cat > $APP_DIR/frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api
EOF
    echo -e "${GREEN}Создан frontend/.env.production${NC}"
  else
    echo -e "${YELLOW}Директория frontend не найдена, пропускаем создание .env.local${NC}"
  fi

echo -e "${GREEN}Шаг 9: Сборка frontend...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    npm run build
    cd ..
fi

echo -e "${GREEN}Шаг 10: Настройка PM2...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true

# Создаем ecosystem файл для PM2
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '$APP_NAME-backend',
      cwd: '$APP_DIR/backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: $BACKEND_PORT
      },
      error_file: '/var/log/pm2/$APP_NAME-backend-error.log',
      out_file: '/var/log/pm2/$APP_NAME-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: '$APP_NAME-frontend',
      cwd: '$APP_DIR/frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: $FRONTEND_PORT,
        NEXT_PUBLIC_API_URL: 'http://localhost:$BACKEND_PORT/api'
      },
      error_file: '/var/log/pm2/$APP_NAME-frontend-error.log',
      out_file: '/var/log/pm2/$APP_NAME-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};
EOF

pm2 start $APP_DIR/ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}Шаг 11: Настройка Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen $APP_PORT;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /uploads {
        alias $APP_DIR/backend/uploads;
    }

    client_max_body_size 10M;
}
EOF

# Создаем симлинк если его нет
if [ ! -L /etc/nginx/sites-enabled/$APP_NAME ]; then
    ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
fi

# Удаляем default конфиг если он есть
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo -e "${GREEN}Шаг 12: Настройка файрвола...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow $APP_PORT/tcp
    ufw allow 22/tcp
    ufw --force enable
fi

echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${GREEN}Приложение доступно по адресу: http://your-server-ip:$APP_PORT${NC}"
echo -e "${GREEN}Проверьте статус: pm2 status${NC}"
echo -e "${GREEN}Логи: pm2 logs $APP_NAME${NC}"

