# Инструкция по обновлению конфигурации на сервере

Если на сервере уже запущено приложение и нужно изменить порт с 3000 на 3001:

## Шаг 1: Остановка текущих процессов

```bash
# Остановить PM2 процессы
pm2 stop all
pm2 delete all

# Убить процессы на порту 3000 (если есть)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

## Шаг 2: Обновление файлов на сервере

```bash
cd /var/www/wellschool-token

# Обновить из git (если используете)
git pull

# Или обновить файлы вручную:
# - frontend/package.json (изменить порт на 3001)
# - ecosystem.config.js (обновить PORT на 3001)
# - /etc/nginx/sites-available/wellschool-token (изменить proxy_pass на localhost:3001)
```

## Шаг 3: Обновление ecosystem.config.js

```bash
nano /var/www/wellschool-token/ecosystem.config.js
```

Измените:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,  // было 3000
  NEXT_PUBLIC_API_URL: 'http://localhost:5001/api'
}
```

## Шаг 4: Обновление Nginx конфигурации

```bash
sudo nano /etc/nginx/sites-available/wellschool-token
```

Измените:
```nginx
location / {
    proxy_pass http://localhost:3001;  # было 3000
    ...
}
```

Проверьте и перезагрузите:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 5: Обновление frontend/package.json

```bash
cd /var/www/wellschool-token/frontend
nano package.json
```

Измените:
```json
"dev": "next dev -p ${PORT:-3001}",
"start": "next start -p ${PORT:-3001}",
```

## Шаг 6: Перезапуск приложения

```bash
cd /var/www/wellschool-token
pm2 start ecosystem.config.js
pm2 save
```

## Шаг 7: Проверка

```bash
# Проверка статуса
pm2 status

# Проверка портов
sudo netstat -tlnp | grep -E '3001|5001|6385'

# Проверка логов
pm2 logs

# Проверка доступности
curl http://localhost:6385
```

## Быстрое решение (одной командой)

```bash
cd /var/www/wellschool-token && \
pm2 stop all && \
sed -i 's/3000/3001/g' ecosystem.config.js && \
sed -i 's/localhost:3000/localhost:3001/g' /etc/nginx/sites-available/wellschool-token && \
sed -i 's/-p 3000/-p ${PORT:-3001}/g' frontend/package.json && \
sudo nginx -t && sudo systemctl reload nginx && \
pm2 start ecosystem.config.js && \
pm2 save
```

