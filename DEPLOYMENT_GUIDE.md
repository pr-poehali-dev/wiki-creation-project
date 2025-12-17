# 🚀 Инструкция по переносу проекта на VPS

## Что потребуется
- VPS сервер (Ubuntu 22.04) - от 2GB RAM
- Доменное имя (опционально, можно использовать IP)
- 1-2 часа времени

---

## Шаг 1: Выбор и настройка VPS

### Рекомендованные провайдеры:

**Timeweb (Россия)**
- Сайт: timeweb.com
- Тариф: "Cloud VPS 2" - 299₽/мес
- Характеристики: 2GB RAM, 1 CPU, 20GB SSD
- Регистрация: нужен телефон + email

**Selectel (Россия)**
- Сайт: selectel.ru
- Тариф: "Облачный сервер S" - от 200₽/мес
- Характеристики: 2GB RAM, 1 vCPU, 10GB SSD

**Digital Ocean (международный)**
- Сайт: digitalocean.com
- Тариф: "Basic Droplet" - $6/мес (~600₽)
- Характеристики: 1GB RAM, 1 CPU, 25GB SSD
- ⚠️ Требуется карта, работающая за границей

### Создание сервера:
1. Зарегистрируйтесь на выбранном хостинге
2. Создайте новый сервер (VPS/Droplet/Cloud)
3. Выберите ОС: **Ubuntu 22.04 LTS**
4. Регион: выберите ближайший к вашим пользователям
5. SSH ключ или пароль root: сохраните в надежное место
6. Создайте сервер и дождитесь запуска (1-3 минуты)
7. Получите IP адрес сервера

---

## Шаг 2: Подключение к серверу

### Для Windows:
1. Скачайте PuTTY: https://putty.org
2. Запустите PuTTY
3. Host Name: введите IP адрес вашего сервера
4. Port: 22
5. Connection type: SSH
6. Нажмите "Open"
7. Войдите как `root` с паролем из панели управления

### Для Mac/Linux:
Откройте терминал и выполните:
```bash
ssh root@ВАШ_IP_АДРЕС
```

---

## Шаг 3: Базовая настройка сервера

Выполните команды по очереди:

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl git nginx postgresql redis-server python3-pip python3-venv

# Установка Node.js (для сборки фронтенда)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка Bun (быстрый менеджер пакетов)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Проверка установки
node -v
bun -v
python3 --version
psql --version
```

---

## Шаг 4: Настройка PostgreSQL

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# Выполните в PostgreSQL консоли:
CREATE DATABASE wiki_db;
CREATE USER wiki_user WITH PASSWORD 'ваш_надежный_пароль_123';
GRANT ALL PRIVILEGES ON DATABASE wiki_db TO wiki_user;
\q

# Разрешить локальные подключения
nano /etc/postgresql/14/main/pg_hba.conf
```

Найдите строку:
```
local   all             all                                     peer
```

Замените на:
```
local   all             all                                     md5
```

Сохраните (Ctrl+O, Enter, Ctrl+X) и перезапустите PostgreSQL:
```bash
systemctl restart postgresql
```

---

## Шаг 5: Настройка MinIO (S3-хранилище для изображений)

```bash
# Скачать MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
mv minio /usr/local/bin/

# Создать директорию для файлов
mkdir -p /mnt/data/minio

# Создать пользователя для MinIO
useradd -r minio-user -s /sbin/nologin
chown -R minio-user:minio-user /mnt/data/minio

# Создать systemd сервис
nano /etc/systemd/system/minio.service
```

Вставьте:
```ini
[Unit]
Description=MinIO
After=network.target

[Service]
User=minio-user
Group=minio-user
Environment="MINIO_ROOT_USER=admin"
Environment="MINIO_ROOT_PASSWORD=ваш_пароль_minio_123"
ExecStart=/usr/local/bin/minio server /mnt/data/minio --console-address ":9001"
Restart=always

[Install]
WantedBy=multi-user.target
```

Сохраните и запустите:
```bash
systemctl daemon-reload
systemctl enable minio
systemctl start minio

# Проверка статуса
systemctl status minio
```

MinIO будет доступен на:
- API: http://ВАШ_IP:9000
- Console: http://ВАШ_IP:9001

---

## Шаг 6: Загрузка и настройка проекта

```bash
# Создать директорию для проекта
mkdir -p /var/www/wiki
cd /var/www/wiki

# Клонировать проект из GitHub
# (Сначала подключите GitHub в poehali.dev!)
git clone https://github.com/ВАШ_ПОЛЬЗОВАТЕЛЬ/ВАШ_РЕПОЗИТОРИЙ.git .

# Установить зависимости фронтенда
bun install

# Собрать фронтенд
bun run build
```

---

## Шаг 7: Настройка backend функций

```bash
# Создать виртуальное окружение для Python
cd /var/www/wiki
python3 -m venv venv
source venv/bin/activate

# Установить зависимости для всех backend функций
pip install fastapi uvicorn psycopg2-binary pillow boto3 pydantic

# Создать главный API файл
nano /var/www/wiki/backend_server.py
```

Вставьте следующий код:
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Добавляем пути к модулям backend
sys.path.insert(0, '/var/www/wiki/backend')

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Импорт всех функций
from admin_activity.index import handler as admin_activity_handler
from image_processor.index import handler as image_processor_handler
from reprocess_images.index import handler as reprocess_images_handler
# ... добавьте остальные функции

@app.post("/api/admin-activity")
async def admin_activity(request: Request):
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "body": await request.body(),
        "queryStringParameters": dict(request.query_params)
    }
    result = admin_activity_handler(event, {})
    return result

@app.post("/api/image-processor")
async def image_processor(request: Request):
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "body": await request.body(),
        "queryStringParameters": dict(request.query_params)
    }
    result = image_processor_handler(event, {})
    return result

# ... добавьте маршруты для остальных функций

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Сохраните и создайте systemd сервис:
```bash
nano /etc/systemd/system/wiki-backend.service
```

Вставьте:
```ini
[Unit]
Description=Wiki Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/wiki
Environment="DATABASE_URL=postgresql://wiki_user:ваш_пароль_123@localhost/wiki_db"
Environment="AWS_ACCESS_KEY_ID=admin"
Environment="AWS_SECRET_ACCESS_KEY=ваш_пароль_minio_123"
ExecStart=/var/www/wiki/venv/bin/python /var/www/wiki/backend_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запустите backend:
```bash
systemctl daemon-reload
systemctl enable wiki-backend
systemctl start wiki-backend
systemctl status wiki-backend
```

---

## Шаг 8: Настройка Nginx (веб-сервер)

```bash
nano /etc/nginx/sites-available/wiki
```

Вставьте:
```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.ru;  # или IP адрес

    # Frontend
    location / {
        root /var/www/wiki/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # MinIO S3
    location /s3/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/wiki /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Шаг 9: Настройка SSL (HTTPS)

```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат (замените на ваш домен)
certbot --nginx -d ваш_домен.ru -d www.ваш_домен.ru

# Автообновление сертификата
systemctl enable certbot.timer
```

---

## Шаг 10: Миграция данных

### База данных:
Если у вас есть данные в текущей базе, экспортируйте их из poehali.dev и импортируйте:

```bash
# На вашем VPS
psql -U wiki_user -d wiki_db < dump.sql
```

### Изображения:
Скачайте все изображения из CDN poehali.dev и загрузите в MinIO:

```bash
# Установить MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
mv mc /usr/local/bin/

# Настроить подключение
mc alias set myminio http://localhost:9000 admin ваш_пароль_minio_123

# Создать bucket
mc mb myminio/files

# Загрузить файлы (если у вас есть локальная копия)
mc cp --recursive ./local_images/ myminio/files/
```

---

## Шаг 11: Обновление URL в коде

Измените `src/config/api.ts`:
```typescript
export const API_URLS = {
  AUTH: "https://ваш_домен.ru/api/auth",
  ITEMS: "https://ваш_домен.ru/api/items",
  GUIDES: "https://ваш_домен.ru/api/guides",
  DATA_MANAGER: "https://ваш_домен.ru/api/data-manager",
  ADMIN_ACTIVITY: "https://ваш_домен.ru/api/admin-activity",
  IMAGE_PROCESSOR: "https://ваш_домен.ru/api/image-processor",
  REPROCESS_IMAGES: "https://ваш_домен.ru/api/reprocess-images",
};
```

Пересоберите фронтенд:
```bash
cd /var/www/wiki
bun run build
systemctl restart nginx
```

---

## Шаг 12: Проверка работы

1. Откройте в браузере: `https://ваш_домен.ru`
2. Проверьте авторизацию в админ-панель
3. Загрузите тестовое изображение
4. Проверьте, что водяные знаки применяются
5. Проверьте работу всех разделов wiki

---

## 📊 Итоговая стоимость

### Минимальная конфигурация (300-500₽/мес):
- VPS 2GB RAM: 299-500₽/мес
- Домен .ru: ~200₽/год (~17₽/мес)
- SSL сертификат: бесплатно (Let's Encrypt)
- **Итого: ~320-520₽/мес**

### Расширенная конфигурация (700-1500₽/мес):
- VPS 4GB RAM: 699-1200₽/мес
- Домен .com/.ru: 500₽/год
- Резервные копии: 100-200₽/мес
- CDN (опционально): 100₽/мес
- **Итого: ~800-1500₽/мес**

### Для сравнения:
- **poehali.dev**: зависит от тарифа платформы
- **Vercel + Supabase**: $0-20/мес (но нужно переписать Python на JS)
- **VPS**: полный контроль за 300-500₽/мес

---

## 🛠 Полезные команды для управления

```bash
# Посмотреть логи backend
journalctl -u wiki-backend -f

# Перезапустить backend
systemctl restart wiki-backend

# Перезапустить nginx
systemctl restart nginx

# Обновить код из GitHub
cd /var/www/wiki
git pull
bun run build
systemctl restart wiki-backend nginx

# Backup базы данных
pg_dump -U wiki_user wiki_db > backup_$(date +%Y%m%d).sql

# Backup файлов MinIO
mc mirror myminio/files /backup/minio-files/
```

---

## ⚠️ Важные моменты

1. **Безопасность:**
   - Измените все пароли по умолчанию
   - Настройте firewall: `ufw allow 80,443/tcp && ufw enable`
   - Регулярно обновляйте систему: `apt update && apt upgrade`

2. **Резервные копии:**
   - Настройте автоматический backup БД (cron)
   - Делайте snapshot VPS раз в неделю
   - Храните копии изображений отдельно

3. **Мониторинг:**
   - Настройте уведомления о падении сервиса (UptimeRobot - бесплатно)
   - Следите за использованием диска: `df -h`
   - Проверяйте логи ошибок регулярно

---

## 🆘 Если что-то пошло не так

1. **Backend не запускается:**
   ```bash
   journalctl -u wiki-backend -n 50
   ```

2. **Nginx показывает ошибку:**
   ```bash
   nginx -t
   tail -f /var/log/nginx/error.log
   ```

3. **База данных не подключается:**
   ```bash
   sudo -u postgres psql -c "\l"
   systemctl status postgresql
   ```

4. **MinIO не работает:**
   ```bash
   systemctl status minio
   journalctl -u minio -n 50
   ```

---

## 📚 Дополнительные ресурсы

- Документация Nginx: https://nginx.org/ru/docs/
- Документация PostgreSQL: https://www.postgresql.org/docs/
- Документация MinIO: https://min.io/docs/
- Сообщество poehali.dev: https://t.me/+QgiLIa1gFRY4Y2Iy

Удачи с развертыванием! 🚀
