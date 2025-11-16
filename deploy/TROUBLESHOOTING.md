# Решение проблемы "Admin login failed"

## Диагностика проблемы

### Шаг 1: Проверка базы данных и администратора

Выполните на сервере:

```bash
cd /var/www/wellschool-token
chmod +x deploy/check-admin.sh
./deploy/check-admin.sh
```

Этот скрипт:
- Проверит существование базы данных
- Проверит наличие администратора
- Создаст администратора, если его нет
- Обновит пароль, если он неверный

### Шаг 2: Проверка работы бэкенда

```bash
# Проверка health check
curl http://localhost:5001/api/health

# Проверка логинов
curl -X POST http://localhost:5001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wellschool.com","password":"admin123"}'
```

### Шаг 3: Проверка логов

```bash
# Логи PM2
pm2 logs wellschool-token-backend --lines 50

# Логи Nginx
sudo tail -f /var/log/nginx/wellschool-token-error.log
sudo tail -f /var/log/nginx/access.log
```

### Шаг 4: Проверка конфигурации Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Проверка активных конфигураций
ls -la /etc/nginx/sites-enabled/

# Просмотр конфигурации
cat /etc/nginx/sites-available/wellschool-token
```

## Возможные решения

### Решение 1: База данных не инициализирована

```bash
cd /var/www/wellschool-token/backend
node -e "const { initialize } = require('./config/database'); initialize(); setTimeout(() => process.exit(0), 2000);"
```

### Решение 2: Администратор не создан

```bash
cd /var/www/wellschool-token/backend
node << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const hashedPassword = bcrypt.hashSync('admin123', 10);
db.run(`INSERT OR REPLACE INTO admins (username, email, password, fullName, role, isActive) 
        VALUES (?, ?, ?, ?, ?, ?)`,
  ['admin', 'admin@wellschool.com', hashedPassword, 'System Administrator', 'super_admin', 1],
  function(err) {
    if (err) {
      console.error('Ошибка:', err);
    } else {
      console.log('✅ Администратор создан/обновлен');
    }
    db.close();
  }
);
EOF
```

### Решение 3: Проблема с CORS

Если проблема в CORS, обновите `backend/server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:6385', 'http://your-server-ip:6385'],
  credentials: true
}));
```

### Решение 4: Проблема с маршрутизацией Nginx

Проверьте, что Nginx правильно проксирует запросы:

```bash
# Проверка проксирования
curl -X POST http://localhost:6385/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wellschool.com","password":"admin123"}'
```

### Решение 5: Перезапуск всех сервисов

```bash
# Остановка
pm2 stop all

# Проверка портов
sudo netstat -tlnp | grep -E '3001|5001|6385'

# Очистка процессов на портах (если нужно)
sudo lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sudo lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Запуск
pm2 start ecosystem.config.js
pm2 save

# Перезагрузка Nginx
sudo systemctl reload nginx
```

## Проверка после исправления

1. Проверьте статус PM2: `pm2 status`
2. Проверьте логи: `pm2 logs`
3. Проверьте доступность: `curl http://localhost:6385`
4. Попробуйте войти через браузер

## Данные для входа

- **Email:** admin@wellschool.com
- **Password:** admin123

Если проблема сохраняется, проверьте логи и убедитесь, что:
- База данных существует и доступна
- Администратор создан и активен
- Бэкенд запущен и отвечает на запросы
- Nginx правильно проксирует запросы

