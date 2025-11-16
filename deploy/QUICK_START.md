# Быстрый старт развертывания на VPS Ubuntu 22.04

## Шаг 1: Подготовка проекта

На вашем локальном компьютере:

```bash
# Убедитесь, что проект готов к деплою
cd /path/to/wellschool-token

# Создайте архив (опционально)
tar -czf wellschool-token.tar.gz --exclude='node_modules' --exclude='.git' .
```

## Шаг 2: Загрузка на сервер

```bash
# Загрузите проект на сервер
scp -r . user@your-server-ip:/var/www/wellschool-token

# Или используйте архив
scp wellschool-token.tar.gz user@your-server-ip:/tmp/
```

## Шаг 3: Подключение к серверу

```bash
ssh user@your-server-ip
```

## Шаг 4: Распаковка (если использовали архив)

```bash
sudo mkdir -p /var/www/wellschool-token
sudo tar -xzf /tmp/wellschool-token.tar.gz -C /var/www/wellschool-token
sudo chown -R $USER:$USER /var/www/wellschool-token
```

## Шаг 5: Запуск скрипта развертывания

```bash
cd /var/www/wellschool-token
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

Скрипт автоматически:
- Установит все зависимости
- Настроит Node.js и PM2
- Настроит Nginx на порту 6385
- Запустит приложение

## Шаг 6: Проверка

После завершения скрипта:

```bash
# Проверьте статус приложений
pm2 status

# Проверьте логи
pm2 logs

# Проверьте доступность
curl http://localhost:6385
```

## Доступ к приложению

Откройте в браузере: `http://your-server-ip:6385`

## Важные файлы и команды

### Файлы конфигурации:
- `/var/www/wellschool-token/.env` - переменные окружения
- `/var/www/wellschool-token/ecosystem.config.js` - конфигурация PM2
- `/etc/nginx/sites-available/wellschool-token` - конфигурация Nginx

### Полезные команды:

```bash
# Перезапуск приложения
pm2 restart all

# Просмотр логов
pm2 logs wellschool-token-backend
pm2 logs wellschool-token-frontend

# Перезагрузка Nginx
sudo systemctl reload nginx

# Проверка портов
sudo netstat -tlnp | grep -E '3001|5001|6385'
```

## Если что-то пошло не так

1. Проверьте логи: `pm2 logs`
2. Проверьте статус: `pm2 status`
3. Проверьте Nginx: `sudo nginx -t`
4. Проверьте файрвол: `sudo ufw status`

## Обновление приложения

```bash
cd /var/www/wellschool-token
# Загрузите новые файлы
npm install
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 restart all
```

