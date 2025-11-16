# Инструкция по развертыванию WellSchool Token на VPS Ubuntu 22.04

## Требования

- VPS с Ubuntu 22.04
- Доступ по SSH с правами root или sudo
- Минимум 1GB RAM, 10GB дискового пространства

## Быстрое развертывание

### Вариант 1: Автоматическое развертывание (рекомендуется)

1. Загрузите проект на сервер:
```bash
# На вашем локальном компьютере
scp -r /path/to/project user@your-server-ip:/var/www/wellschool-token
```

2. Подключитесь к серверу:
```bash
ssh user@your-server-ip
```

3. Запустите скрипт развертывания:
```bash
cd /var/www/wellschool-token
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

### Вариант 2: Ручное развертывание

#### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl wget git build-essential sqlite3 nginx

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2
sudo npm install -g pm2
```

#### Шаг 2: Загрузка проекта

```bash
# Создание директории
sudo mkdir -p /var/www/wellschool-token
sudo chown -R $USER:$USER /var/www/wellschool-token

# Клонирование или загрузка проекта
cd /var/www/wellschool-token
# Загрузите файлы проекта сюда
```

#### Шаг 3: Установка зависимостей

```bash
# В корне проекта
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..
```

#### Шаг 4: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cat > .env << EOF
# Backend
NODE_ENV=production
PORT=5001
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001/api
PORT=3001
EOF
```

#### Шаг 5: Настройка PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'wellschool-token-backend',
      cwd: '/var/www/wellschool-token/backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: '/var/log/pm2/wellschool-token-backend-error.log',
      out_file: '/var/log/pm2/wellschool-token-backend-out.log',
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'wellschool-token-frontend',
      cwd: '/var/www/wellschool-token/frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXT_PUBLIC_API_URL: 'http://localhost:5001/api'
      },
      error_file: '/var/log/pm2/wellschool-token-frontend-error.log',
      out_file: '/var/log/pm2/wellschool-token-frontend-out.log',
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};
```

Запустите приложения:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Шаг 6: Настройка Nginx

Создайте конфигурацию Nginx:

```bash
sudo nano /etc/nginx/sites-available/wellschool-token
```

Вставьте следующее:

```nginx
server {
    listen 6385;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads {
        alias /var/www/wellschool-token/backend/uploads;
    }

    client_max_body_size 10M;
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/wellschool-token /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### Шаг 7: Настройка файрвола

```bash
sudo ufw allow 6385/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable
```

## Управление приложением

### PM2 команды

```bash
# Статус приложений
pm2 status

# Логи
pm2 logs wellschool-token-backend
pm2 logs wellschool-token-frontend

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all

# Удаление
pm2 delete all
```

### Nginx команды

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Статус
sudo systemctl status nginx
```

## Обновление приложения

```bash
cd /var/www/wellschool-token

# Если используется git
git pull

# Обновление зависимостей
npm install
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# Перезапуск
pm2 restart all
```

## Проверка работы

1. Откройте браузер и перейдите по адресу: `http://your-server-ip:6385`
2. Проверьте логи: `pm2 logs`
3. Проверьте статус: `pm2 status`

## Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs

# Проверьте порты
sudo netstat -tlnp | grep -E '3001|5001|6385'

# Проверьте права доступа
sudo chown -R $USER:$USER /var/www/wellschool-token
```

### Nginx ошибки

```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log
```

### Проблемы с базой данных

```bash
# Проверьте существование базы данных
ls -la /var/www/wellschool-token/backend/database.sqlite

# Проверьте права доступа
sudo chmod 664 /var/www/wellschool-token/backend/database.sqlite
sudo chown $USER:$USER /var/www/wellschool-token/backend/database.sqlite
```

## Безопасность

1. **Измените JWT_SECRET** в `.env` на случайный строку
2. **Настройте SSL** (опционально, используя Let's Encrypt)
3. **Ограничьте доступ** к портам через файрвол
4. **Регулярно обновляйте** систему и зависимости

## SSL сертификат (опционально)

Для использования HTTPS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Затем обновите конфигурацию Nginx для использования порта 443.

