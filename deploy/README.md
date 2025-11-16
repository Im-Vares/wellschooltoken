# Развертывание WellSchool Token

## Быстрый старт

### Автоматическое развертывание

```bash
cd ~/wellschooltoken
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

Скрипт автоматически:
- Установит Node.js, PM2, Nginx
- Настроит переменные окружения
- Установит зависимости
- Соберет frontend
- Настроит PM2 для запуска приложений
- Настроит Nginx на порту 6385

### Ручное развертывание

См. `QUICK_START.md` для подробных инструкций.

## Структура проекта

- `deploy.sh` - основной скрипт развертывания
- `nginx.conf` - конфигурация Nginx
- `create-admin.js` - скрипт для создания/обновления администратора

## Порты

- **6385** - Nginx (внешний порт)
- **3001** - Frontend (Next.js)
- **5001** - Backend (Express API)

## Управление

```bash
# Статус приложений
pm2 status

# Логи
pm2 logs

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all
```

## Создание администратора

```bash
cd ~/wellschooltoken
node deploy/create-admin.js
```

По умолчанию:
- Email: `admin@wellschool.com`
- Password: `admin123`

## Переменные окружения

Файлы `.env` создаются автоматически при развертывании. Для frontend используется `frontend/.env.local` с переменной `NEXT_PUBLIC_API_URL`.
