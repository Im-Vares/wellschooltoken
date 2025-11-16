# 🚀 Инструкция по развертыванию WellSchool Token

## Подготовка проекта

### 1. Убедитесь, что все файлы на месте

```bash
# Проверьте структуру проекта
ls -la
# Должны быть папки: backend, frontend, deploy
```

### 2. Закоммитьте и запушьте изменения в Git (если используете)

```bash
git add .
git commit -m "Готово к развертыванию"
git push
```

## Развертывание на сервере

### Шаг 1: Подключитесь к серверу

```bash
ssh root@your-server-ip
# или
ssh user@your-server-ip
```

### Шаг 2: Загрузите проект на сервер

**Вариант A: Через Git (рекомендуется)**
```bash
cd /var/www
git clone your-repository-url wellschool-token
cd wellschool-token
```

**Вариант B: Через SCP (если нет Git)**
```bash
# На вашем локальном компьютере
scp -r /path/to/wellschooltoken root@your-server-ip:/var/www/wellschool-token
```

### Шаг 3: Запустите скрипт развертывания

```bash
cd /var/www/wellschool-token
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

Скрипт автоматически:
- ✅ Установит Node.js, PM2, Nginx
- ✅ Настроит переменные окружения
- ✅ Установит зависимости
- ✅ Соберет frontend
- ✅ Настроит PM2 для автозапуска
- ✅ Настроит Nginx на порту 6385
- ✅ Откроет порты в firewall

### Шаг 4: Проверьте статус

```bash
# Проверьте PM2 процессы
pm2 status

# Должны быть запущены:
# - wellschool-token-backend (порт 5001)
# - wellschool-token-frontend (порт 3001)

# Проверьте Nginx
sudo systemctl status nginx

# Проверьте доступность
curl http://localhost:6385
```

### Шаг 5: Создайте администратора (если нужно)

```bash
cd /var/www/wellschool-token
node deploy/create-admin.js
```

По умолчанию:
- Email: `admin@wellschool.com`
- Password: `admin123`

## Доступ к приложению

После развертывания приложение будет доступно по адресу:

```
http://your-server-ip:6385
```

## Управление приложением

### Просмотр логов

```bash
# Все логи
pm2 logs

# Только backend
pm2 logs wellschool-token-backend

# Только frontend
pm2 logs wellschool-token-frontend
```

### Перезапуск

```bash
# Перезапустить все
pm2 restart all

# Перезапустить конкретный процесс
pm2 restart wellschool-token-backend
pm2 restart wellschool-token-frontend
```

### Остановка

```bash
pm2 stop all
```

### Обновление проекта

```bash
cd /var/www/wellschool-token

# Обновить код
git pull  # или загрузить новые файлы

# Переустановить зависимости (если нужно)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Пересобрать frontend (если изменился)
cd frontend && npm run build && cd ..

# Перезапустить
pm2 restart all
```

## Порты

- **6385** - Nginx (внешний доступ)
- **3001** - Frontend (Next.js, внутренний)
- **5001** - Backend (Express API, внутренний)

## Структура файлов на сервере

```
/var/www/wellschool-token/
├── backend/          # Backend приложение
├── frontend/         # Frontend приложение
├── deploy/           # Скрипты развертывания
├── .env              # Переменные окружения
└── ecosystem.config.js  # Конфигурация PM2
```

## Переменные окружения

Файлы `.env` создаются автоматически. Для frontend также создается `frontend/.env.local` с `NEXT_PUBLIC_API_URL`.

## Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs --lines 50

# Проверьте порты
sudo netstat -tlnp | grep -E '3001|5001|6385'

# Перезапустите
pm2 restart all
```

### 502 Bad Gateway

```bash
# Проверьте, что приложения запущены
pm2 status

# Проверьте Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Регистрация/вход не работают

```bash
# Проверьте переменные окружения
cat frontend/.env.local

# Должно быть:
# NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Перезапустите frontend
pm2 restart wellschool-token-frontend
```

## Безопасность

- ✅ Измените пароль администратора после первого входа
- ✅ Настройте SSL/TLS (Let's Encrypt) для HTTPS
- ✅ Регулярно обновляйте зависимости: `npm audit fix`
- ✅ Делайте резервные копии базы данных: `cp backend/database.sqlite backup.sqlite`

## Готово! 🎉

После выполнения всех шагов ваше приложение будет доступно на `http://your-server-ip:6385`

