# Исправление ошибки развертывания

## Проблема

Ошибка: `./deploy.sh: line 102: /var/www/wellschool-token/frontend/.env.local: No such file or directory`

Это происходит, когда скрипт пытается создать файл в несуществующей директории.

## Решение

### Вариант 1: Если проект уже на сервере (в ~/wellschooltoken)

```bash
# Перейдите в директорию проекта
cd ~/wellschooltoken

# Скопируйте проект в нужное место
sudo mkdir -p /var/www/wellschool-token
sudo cp -r . /var/www/wellschool-token/
sudo chown -R $USER:$USER /var/www/wellschool-token

# Запустите скрипт развертывания
cd /var/www/wellschool-token
sudo ./deploy/deploy.sh
```

### Вариант 2: Исправить скрипт и запустить заново

Скрипт уже исправлен. Просто запустите:

```bash
cd /var/www/wellschool-token
# или если проект в ~/wellschooltoken
cd ~/wellschooltoken
sudo ./deploy/deploy.sh
```

### Вариант 3: Ручное создание директорий

```bash
# Создайте директорию frontend если её нет
mkdir -p /var/www/wellschool-token/frontend

# Создайте .env.local вручную
cat > /var/www/wellschool-token/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5001/api
EOF

# Продолжите развертывание
cd /var/www/wellschool-token
sudo ./deploy/deploy.sh
```

## Проверка

После исправления проверьте:

```bash
# Проверьте структуру
ls -la /var/www/wellschool-token/
ls -la /var/www/wellschool-token/frontend/

# Должны быть:
# - backend/
# - frontend/
# - deploy/
# - package.json
```

## Если проект в другой директории

Если вы находитесь в `~/wellschooltoken`, скрипт теперь автоматически определит это и скопирует проект в `/var/www/wellschool-token`.

