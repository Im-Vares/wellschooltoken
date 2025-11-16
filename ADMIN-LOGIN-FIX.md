# Исправление проблемы входа администратора

## Проблема

Backend работает и API отвечает правильно, но вход через браузер не работает.

## Решение

### Шаг 1: Проверьте, что frontend запущен

```bash
# Проверьте процессы
ps aux | grep "next dev\|next start"

# Или проверьте порт
netstat -tlnp | grep 3001
# или
lsof -i :3001
```

### Шаг 2: Настройте переменные окружения frontend

```bash
cd ~/wellschooltoken/frontend

# Создайте/обновите .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5001/api
EOF

# Или используйте скрипт
cd ..
./fix-frontend-api.sh
```

### Шаг 3: Перезапустите frontend

Если frontend запущен в screen:
```bash
screen -r wellschool
# Нажмите Ctrl+C для остановки
# Затем снова запустите
./start.sh
```

Или если запущен отдельно:
```bash
# Остановите frontend
pkill -f "next dev"

# Запустите заново
cd ~/wellschooltoken
./start.sh
```

### Шаг 4: Проверьте в браузере

1. Откройте консоль разработчика (F12)
2. Перейдите на вкладку **Network**
3. Попробуйте войти
4. Найдите запрос к `/api/auth/admin/login`
5. Проверьте:
   - **URL запроса** - должен быть `http://localhost:5001/api/auth/admin/login` или через прокси
   - **Статус ответа** - должен быть 200
   - **Ответ сервера** - должен содержать `token`

### Шаг 5: Проверьте конфигурацию Next.js

Убедитесь, что `next.config.js` правильно настроен:

```javascript
env: {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
}
```

## Если используется Nginx

Если приложение доступно через Nginx на порту 6385:

1. Проверьте конфигурацию Nginx:
```bash
cat /etc/nginx/sites-available/wellschool-token | grep -A 10 "location /api"
```

2. Убедитесь, что `/api` проксируется на `http://localhost:5001`

3. В frontend используйте относительный URL:
```bash
# В .env.local используйте относительный путь
echo "NEXT_PUBLIC_API_URL=/api" > frontend/.env.local
```

## Быстрое решение

```bash
# 1. Настройте .env.local
cd ~/wellschooltoken/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5001/api" > .env.local

# 2. Перезапустите frontend
cd ..
# Остановите текущий процесс (Ctrl+C в screen)
# Запустите заново
./start.sh
```

## Проверка

После перезапуска проверьте:

1. **В браузере (F12 → Console)**: Должны быть запросы к `/api/auth/admin/login`
2. **В Network tab**: Запрос должен быть успешным (200)
3. **В Response**: Должен быть токен

Если проблема сохраняется, проверьте логи backend в screen сессии.

