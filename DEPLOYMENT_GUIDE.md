# 🚀 Инструкция по переносу проекта на Timeweb VPS 2

## Что потребуется
- ✅ Timeweb VPS 2 (299₽/мес) - вы выбрали
- Доменное имя (опционально, можно использовать IP от Timeweb)
- 1-2 часа времени

**Стоимость:** 299₽/мес за VPS + 200₽/год за домен (опционально) = ~320₽/мес

---

## 📋 Характеристики Timeweb VPS 2

- **CPU:** 1 ядро (2.4 GHz)
- **RAM:** 2 GB
- **Диск:** 20 GB SSD
- **Трафик:** Безлимит
- **ОС:** Ubuntu 22.04 LTS (предустановлена)
- **Панель:** Удобная панель управления Timeweb
- **Бэкапы:** Входят в стоимость (автоматические)
- **IP адрес:** 1 бесплатный статический IP

---

## Шаг 1: Регистрация и создание сервера на Timeweb

### 1.1. Регистрация

1. Перейдите на **https://timeweb.com**
2. Нажмите "Регистрация" в правом верхнем углу
3. Заполните форму:
   - Email
   - Телефон (для подтверждения)
   - Пароль
4. Подтвердите email и телефон
5. Пополните баланс минимум на 299₽ (можно картой, СБП, Юmoney)

### 1.2. Создание Cloud VPS

1. Войдите в **Панель управления Timeweb**
2. В левом меню выберите **"Cloud серверы"** → **"Создать сервер"**
3. Выберите конфигурацию:
   - **Тариф:** VPS 2 (2 GB RAM, 1 CPU, 20 GB SSD)
   - **ОС:** Ubuntu 22.04 LTS (выберите из списка)
   - **Дата-центр:** Москва (лучшая скорость для России)
   - **Период:** Помесячная оплата
4. **Настройки доступа:**
   - Поставьте галочку "Установить пароль root"
   - Придумайте и запишите надежный пароль (например: `MyServer2024!Pass`)
   - Или загрузите SSH-ключ (если умеете)
5. **Дополнительные опции:**
   - Автоматические бэкапы: **включено по умолчанию** (бесплатно!)
   - Firewall: пока не настраивайте, настроим позже
6. Нажмите **"Заказать сервер"**
7. Дождитесь создания сервера (1-3 минуты)

### 1.3. Получение данных для подключения

После создания сервера вы увидите:
- **IP адрес:** например, 185.104.114.123 (запишите!)
- **Логин:** root
- **Пароль:** тот, что вы придумали

**💡 Совет:** Сразу запишите эти данные в безопасное место (менеджер паролей, блокнот).

---

## Шаг 2: Подключение к серверу Timeweb

### Для Windows:

**Способ 1: Через браузер (самый простой)**
1. В панели Timeweb найдите ваш сервер
2. Нажмите на три точки → **"Консоль"**
3. Откроется веб-терминал прямо в браузере
4. Войдите с логином `root` и вашим паролем

**Способ 2: Через PuTTY**
1. Скачайте PuTTY: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
2. Установите и запустите PuTTY
3. В поле **"Host Name"**: введите ваш IP адрес (например, 185.104.114.123)
4. Port: **22**
5. Connection type: **SSH**
6. Нажмите **"Open"**
7. При первом подключении появится предупреждение - нажмите **"Yes"**
8. Войдите:
   - login as: `root`
   - password: ваш пароль (при вводе пароль не отображается - это нормально!)

### Для Mac/Linux:

1. Откройте **Терминал**
2. Выполните команду:
```bash
ssh root@ВАШ_IP_АДРЕС
```
Например:
```bash
ssh root@185.104.114.123
```
3. При первом подключении введите `yes`
4. Введите пароль (при вводе пароль не отображается)

**✅ Вы подключились!** Теперь видите приглашение вида: `root@server:~#`

---

## Шаг 3: Автоматическая установка всех компонентов

Я подготовил автоматический скрипт, который установит всё за вас!

### 3.1. Создайте скрипт установки

Скопируйте и вставьте в терминал (всё целиком):

```bash
cat > /root/setup.sh << 'EOF'
#!/bin/bash
set -e

echo "========================================="
echo "🚀 Установка Wiki проекта на Timeweb VPS"
echo "========================================="

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка базовых пакетов
echo "📦 Установка базовых пакетов..."
apt install -y curl git nginx postgresql postgresql-contrib python3-pip python3-venv build-essential ufw

# Установка Node.js 20
echo "📦 Установка Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка Bun
echo "📦 Установка Bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Установка MinIO
echo "📦 Установка MinIO (S3-хранилище)..."
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

# Установка MinIO Client
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Настройка PostgreSQL
echo "🗄️ Настройка PostgreSQL..."
sudo -u postgres psql << PSQL
CREATE DATABASE wiki_db;
CREATE USER wiki_user WITH PASSWORD 'Wiki2024SecurePass!';
GRANT ALL PRIVILEGES ON DATABASE wiki_db TO wiki_user;
ALTER DATABASE wiki_db OWNER TO wiki_user;
\q
PSQL

# Настройка pg_hba.conf для локальных подключений
sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' /etc/postgresql/14/main/pg_hba.conf
systemctl restart postgresql

# Создание директорий
echo "📁 Создание директорий проекта..."
mkdir -p /var/www/wiki
mkdir -p /mnt/data/minio
useradd -r minio-user -s /sbin/nologin || true
chown -R minio-user:minio-user /mnt/data/minio

# Настройка MinIO сервиса
echo "⚙️ Настройка MinIO..."
cat > /etc/systemd/system/minio.service << MINIO
[Unit]
Description=MinIO
After=network.target

[Service]
User=minio-user
Group=minio-user
Environment="MINIO_ROOT_USER=admin"
Environment="MINIO_ROOT_PASSWORD=MinioSecure2024Pass!"
ExecStart=/usr/local/bin/minio server /mnt/data/minio --console-address ":9001" --address ":9000"
Restart=always

[Install]
WantedBy=multi-user.target
MINIO

systemctl daemon-reload
systemctl enable minio
systemctl start minio

# Настройка Firewall
echo "🔒 Настройка Firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 9000/tcp  # MinIO API
ufw allow 9001/tcp  # MinIO Console
ufw reload

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📝 Сохраните эти данные:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️ PostgreSQL:"
echo "   Database: wiki_db"
echo "   User: wiki_user"
echo "   Password: Wiki2024SecurePass!"
echo "   DSN: postgresql://wiki_user:Wiki2024SecurePass!@localhost/wiki_db"
echo ""
echo "💾 MinIO (S3):"
echo "   Console: http://ВАШ_IP:9001"
echo "   API: http://ВАШ_IP:9000"
echo "   User: admin"
echo "   Password: MinioSecure2024Pass!"
echo ""
echo "🔥 Firewall: настроен (порты 22, 80, 443, 9000, 9001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Следующий шаг: загрузка проекта из GitHub"
EOF

chmod +x /root/setup.sh
```

### 3.2. Запустите скрипт

```bash
bash /root/setup.sh
```

**⏱️ Время выполнения:** 5-10 минут

Скрипт установит:
- Node.js и Bun
- PostgreSQL с настроенной базой данных
- MinIO (S3-хранилище)
- Nginx (веб-сервер)
- Firewall (безопасность)

**📝 В конце скрипт выведет все пароли - обязательно сохраните их!**

---

## Шаг 4: Подключение домена (опционально)

### Если у вас УЖЕ есть домен:

1. Зайдите в панель вашего регистратора доменов (где купили домен)
2. Найдите раздел **"DNS настройки"** или **"Управление DNS"**
3. Создайте **A-запись**:
   - Имя: `@` (для example.ru) или `wiki` (для wiki.example.ru)
   - Тип: A
   - Значение: ваш IP адрес VPS
   - TTL: 3600
4. Создайте **A-запись** для www (опционально):
   - Имя: `www`
   - Тип: A
   - Значение: ваш IP адрес VPS
5. Подождите 5-30 минут (распространение DNS)

### Если домена НЕТ:

**Вариант 1: Купить домен на Timeweb**
1. В панели Timeweb → **"Домены"** → **"Зарегистрировать домен"**
2. Выберите домен (например: `mywiki.ru`)
3. Цена: от 199₽/год
4. После покупки домен автоматически привяжется к вашему IP

**Вариант 2: Купить на reg.ru, nic.ru**
1. Зарегистрируйте домен на любом регистраторе
2. Привяжите A-запись к IP вашего VPS (см. выше)

**Вариант 3: Использовать IP адрес**
- Можно использовать сайт просто по IP: `http://185.104.114.123`
- Минус: нет HTTPS, неудобно запоминать

---

## Шаг 5: Загрузка проекта из GitHub

### 5.1. Подключите GitHub в poehali.dev

1. Откройте ваш проект в **poehali.dev**
2. Нажмите **"Скачать"** → **"Подключить GitHub"**
3. Авторизуйте GitHub (выберите "All repositories")
4. Вернитесь в poehali.dev → нажмите **"GitHub"** → выберите аккаунт
5. Код автоматически загрузится в новый репозиторий
6. Скопируйте URL репозитория (например: `https://github.com/username/wiki-project.git`)

### 5.2. Клонируйте проект на VPS

На вашем VPS выполните:

```bash
cd /var/www/wiki

# Клонируйте репозиторий (замените URL на ваш!)
git clone https://github.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ.git .

# Если требуется авторизация:
# 1. Перейдите на GitHub → Settings → Developer settings → Personal access tokens
# 2. Создайте token с правами "repo"
# 3. Используйте: git clone https://TOKEN@github.com/username/repo.git .
```

### 5.3. Установка зависимостей и сборка

```bash
cd /var/www/wiki

# Установка зависимостей frontend
~/.bun/bin/bun install

# Сборка frontend
~/.bun/bin/bun run build

# Создание виртуального окружения Python
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей backend
pip install fastapi uvicorn psycopg2-binary pillow boto3 pydantic python-multipart
```

---

## Шаг 6: Настройка Backend API

### 6.1. Создайте главный файл API

```bash
nano /var/www/wiki/backend_server.py
```

Вставьте следующий код (Ctrl+Shift+V или правой кнопкой):

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
import sys

# Добавляем пути к модулям backend
sys.path.insert(0, '/var/www/wiki/backend')

# Устанавливаем переменные окружения
os.environ['DATABASE_URL'] = 'postgresql://wiki_user:Wiki2024SecurePass!@localhost/wiki_db'
os.environ['AWS_ACCESS_KEY_ID'] = 'admin'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'MinioSecure2024Pass!'

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
try:
    from auth_admin.index import handler as auth_handler
    from wiki_items.index import handler as items_handler
    from guides.index import handler as guides_handler
    from data_manager.index import handler as data_manager_handler
    from admin_activity.index import handler as admin_activity_handler
    from image_processor.index import handler as image_processor_handler
    from reprocess_images.index import handler as reprocess_images_handler
except Exception as e:
    print(f"Error importing handlers: {e}")

class MockContext:
    request_id = "local"
    function_name = "local"
    function_version = "1.0"
    memory_limit_in_mb = 256

async def call_handler(handler, request: Request):
    """Универсальный обработчик для всех функций"""
    body = await request.body()
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "body": body.decode() if body else "{}",
        "queryStringParameters": dict(request.query_params),
        "pathParams": {},
        "params": {},
        "multiValueParams": {},
        "multiValueHeaders": {},
        "multiValueQueryStringParameters": {},
        "isBase64Encoded": False,
        "requestContext": {
            "requestId": "local-request",
            "identity": {"sourceIp": request.client.host, "userAgent": request.headers.get("user-agent", "")},
            "httpMethod": request.method,
            "requestTime": "",
            "requestTimeEpoch": 0
        }
    }
    
    context = MockContext()
    result = handler(event, context)
    
    return JSONResponse(
        status_code=result.get('statusCode', 200),
        content=json.loads(result.get('body', '{}')),
        headers=result.get('headers', {})
    )

@app.api_route("/api/auth", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def auth(request: Request):
    return await call_handler(auth_handler, request)

@app.api_route("/api/items", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def items(request: Request):
    return await call_handler(items_handler, request)

@app.api_route("/api/guides", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def guides(request: Request):
    return await call_handler(guides_handler, request)

@app.api_route("/api/data-manager", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def data_manager(request: Request):
    return await call_handler(data_manager_handler, request)

@app.api_route("/api/admin-activity", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def admin_activity(request: Request):
    return await call_handler(admin_activity_handler, request)

@app.api_route("/api/image-processor", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def image_processor(request: Request):
    return await call_handler(image_processor_handler, request)

@app.api_route("/api/reprocess-images", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def reprocess_images(request: Request):
    return await call_handler(reprocess_images_handler, request)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Сохраните: **Ctrl+O** → **Enter** → **Ctrl+X**

### 6.2. Создайте systemd сервис для backend

```bash
nano /etc/systemd/system/wiki-backend.service
```

Вставьте:

```ini
[Unit]
Description=Wiki Backend API
After=network.target postgresql.service minio.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/wiki
Environment="DATABASE_URL=postgresql://wiki_user:Wiki2024SecurePass!@localhost/wiki_db"
Environment="AWS_ACCESS_KEY_ID=admin"
Environment="AWS_SECRET_ACCESS_KEY=MinioSecure2024Pass!"
Environment="PYTHONPATH=/var/www/wiki"
ExecStart=/var/www/wiki/venv/bin/python /var/www/wiki/backend_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Сохраните: **Ctrl+O** → **Enter** → **Ctrl+X**

### 6.3. Запустите backend

```bash
systemctl daemon-reload
systemctl enable wiki-backend
systemctl start wiki-backend

# Проверка статуса
systemctl status wiki-backend

# Проверка работы API
curl http://localhost:8000/health
```

Должны увидеть: `{"status":"ok"}`

---

## Шаг 7: Настройка Nginx (веб-сервер)

### 7.1. Создайте конфигурацию Nginx

```bash
nano /etc/nginx/sites-available/wiki
```

**Если используете ДОМЕН:**

```nginx
server {
    listen 80;
    server_name ваш_домен.ru www.ваш_домен.ru;

    client_max_body_size 20M;

    # Frontend
    location / {
        root /var/www/wiki/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # MinIO S3 (CDN для изображений)
    location /cdn/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Если используете только IP (без домена):**

```nginx
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 20M;

    # Frontend
    location / {
        root /var/www/wiki/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # MinIO S3 (CDN для изображений)
    location /cdn/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Сохраните: **Ctrl+O** → **Enter** → **Ctrl+X**

### 7.2. Активируйте конфигурацию

```bash
# Удалите дефолтный конфиг
rm /etc/nginx/sites-enabled/default

# Создайте символическую ссылку
ln -s /etc/nginx/sites-available/wiki /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
```

---

## Шаг 8: Обновление URL в коде проекта

### 8.1. Откройте файл конфигурации API

```bash
nano /var/www/wiki/src/config/api.ts
```

### 8.2. Замените URL

**Если используете ДОМЕН:**

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

**Если используете IP (временно, до настройки SSL):**

```typescript
export const API_URLS = {
  AUTH: "http://ВАШ_IP/api/auth",
  ITEMS: "http://ВАШ_IP/api/items",
  GUIDES: "http://ВАШ_IP/api/guides",
  DATA_MANAGER: "http://ВАШ_IP/api/data-manager",
  ADMIN_ACTIVITY: "http://ВАШ_IP/api/admin-activity",
  IMAGE_PROCESSOR: "http://ВАШ_IP/api/image-processor",
  REPROCESS_IMAGES: "http://ВАШ_IP/api/reprocess-images",
};
```

Сохраните: **Ctrl+O** → **Enter** → **Ctrl+X**

### 8.3. Пересоберите фронтенд

```bash
cd /var/www/wiki
~/.bun/bin/bun run build
systemctl restart nginx
```

---

## Шаг 9: Настройка MinIO (S3-хранилище)

### 9.1. Откройте MinIO Console

Откройте в браузере: `http://ВАШ_IP:9001`

Войдите:
- **Username:** admin
- **Password:** MinioSecure2024Pass!

### 9.2. Создайте bucket для файлов

1. В левом меню нажмите **"Buckets"**
2. Нажмите **"Create Bucket"**
3. Bucket Name: **files**
4. Нажмите **"Create Bucket"**

### 9.3. Настройте публичный доступ (для CDN)

1. Кликните на bucket **"files"**
2. Перейдите во вкладку **"Access"** (или "Политики доступа")
3. Нажмите **"Add Access Rule"** (или "Edit Policy")
4. Вставьте следующую политику:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::files/*"]
    }
  ]
}
```

5. Сохраните

### 9.4. Обновите код для работы с локальным S3

В backend функциях (где используется S3) нужно поменять endpoint:

```bash
nano /var/www/wiki/backend/image-processor/index.py
```

Найдите строку:
```python
endpoint_url='https://bucket.poehali.dev',
```

Замените на:
```python
endpoint_url='http://localhost:9000',
```

Сохраните и перезапустите backend:
```bash
systemctl restart wiki-backend
```

---

## Шаг 10: Настройка SSL (HTTPS) с Let's Encrypt

**⚠️ Этот шаг только если у вас есть ДОМЕН!**

### 10.1. Установите Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 10.2. Получите SSL сертификат

```bash
certbot --nginx -d ваш_домен.ru -d www.ваш_домен.ru
```

Ответьте на вопросы:
1. **Email:** ваш email (для уведомлений об истечении)
2. **Terms of Service:** `Y` (согласиться)
3. **Share email:** `N` (не делиться email)
4. **Redirect HTTP to HTTPS:** `2` (перенаправлять на HTTPS)

### 10.3. Автообновление сертификата

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

Сертификат будет автоматически обновляться каждые 60 дней.

### 10.4. Обновите URL в коде на HTTPS

```bash
nano /var/www/wiki/src/config/api.ts
```

Замените `http://` на `https://`:

```typescript
export const API_URLS = {
  AUTH: "https://ваш_домен.ru/api/auth",
  // ... остальные URL
};
```

Пересоберите:
```bash
cd /var/www/wiki
~/.bun/bin/bun run build
systemctl restart nginx
```

---

## Шаг 11: Миграция данных из poehali.dev

### 11.1. Миграция базы данных

Если у вас есть данные в базе данных на poehali.dev, выполните SQL запросы для создания таблиц:

```bash
psql -U wiki_user -d wiki_db
```

Выполните в консоли PostgreSQL:

```sql
-- Пример создания таблицы (замените на ваши таблицы)
CREATE TABLE IF NOT EXISTS admin_activity (
    email VARCHAR(255) PRIMARY KEY,
    nickname VARCHAR(255),
    last_seen TIMESTAMP DEFAULT NOW(),
    login_count INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0
);

-- Добавьте остальные таблицы из вашего проекта
-- (смотрите файлы в db_migrations/)

\q
```

### 11.2. Миграция изображений

Если у вас есть изображения в CDN poehali.dev, скачайте их локально и загрузите в MinIO:

**Вариант 1: Вручную через MinIO Console**
1. Откройте MinIO Console: `http://ВАШ_IP:9001`
2. Зайдите в bucket **"files"**
3. Нажмите **"Upload"** → **"Upload Files"**
4. Выберите изображения
5. Загрузите

**Вариант 2: Через MinIO Client (если много файлов)**

На вашем компьютере:
```bash
# Скачайте все изображения из CDN poehali.dev
# (вручную или скриптом)

# Установите MinIO Client (mc)
# Windows: скачайте с https://dl.min.io/client/mc/release/windows-amd64/mc.exe
# Mac/Linux: brew install minio/stable/mc

# Настройте подключение к вашему MinIO
mc alias set myminio http://ВАШ_IP:9000 admin MinioSecure2024Pass!

# Загрузите папку с изображениями
mc cp --recursive ./local_images/ myminio/files/
```

### 11.3. Обновите URL изображений в базе/коде

Замените в коде все ссылки с:
```
https://cdn.poehali.dev/files/...
```

На:
```
https://ваш_домен.ru/cdn/files/...
```
или
```
http://ВАШ_IP/cdn/files/...
```

---

## Шаг 12: Проверка работы сайта

### 12.1. Откройте сайт в браузере

**С доменом:**
```
https://ваш_домен.ru
```

**С IP:**
```
http://ВАШ_IP
```

### 12.2. Проверьте функциональность

✅ **Что проверить:**

1. **Главная страница открывается**
2. **Wiki предметы загружаются**
3. **Авторизация в админ-панель работает**
   - Логин и пароль те же, что на poehali.dev
4. **Загрузка изображений через админку**
   - Попробуйте добавить новый предмет с картинкой
   - Проверьте, что водяной знак накладывается
5. **Кнопка "Обновить водяные знаки" работает**
6. **Онлайн пользователи отображаются**
7. **Защита от копирования работает**
   - Правая кнопка мыши заблокирована
   - Ctrl+C не работает на тексте

### 12.3. Проверьте логи (если что-то не работает)

```bash
# Логи backend
journalctl -u wiki-backend -n 50 -f

# Логи Nginx
tail -f /var/log/nginx/error.log

# Логи MinIO
journalctl -u minio -n 50

# Статус всех сервисов
systemctl status wiki-backend
systemctl status nginx
systemctl status postgresql
systemctl status minio
```

---

## 🎉 Готово! Ваш сайт работает!

### 📊 Что у вас теперь есть:

✅ Полностью рабочий сайт на вашем собственном сервере  
✅ Все функции работают 1 в 1 как на poehali.dev  
✅ Автоматические бэкапы от Timeweb  
✅ SSL сертификат (если настроили домен)  
✅ S3-хранилище для изображений  
✅ PostgreSQL база данных  

### 💰 Итоговая стоимость:

- **Timeweb VPS 2:** 299₽/мес
- **Домен (опционально):** 200₽/год (~17₽/мес)
- **Всё остальное:** бесплатно (Nginx, PostgreSQL, MinIO, SSL)

**Итого: 316₽/мес или 299₽/мес без домена**

---

## 🛠️ Полезные команды для управления

### Обновление кода из GitHub

```bash
cd /var/www/wiki
git pull
~/.bun/bin/bun install
~/.bun/bin/bun run build
systemctl restart wiki-backend
systemctl restart nginx
```

### Просмотр логов

```bash
# Backend логи (последние 50 строк, обновление в реальном времени)
journalctl -u wiki-backend -n 50 -f

# Nginx логи
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PostgreSQL логи
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Перезапуск сервисов

```bash
systemctl restart wiki-backend    # Backend API
systemctl restart nginx            # Веб-сервер
systemctl restart postgresql       # База данных
systemctl restart minio            # S3-хранилище
```

### Резервное копирование

```bash
# Backup базы данных
pg_dump -U wiki_user wiki_db > /root/backups/wiki_db_$(date +%Y%m%d).sql

# Backup файлов MinIO
mc mirror myminio/files /root/backups/minio-files/

# Backup кода
tar -czf /root/backups/wiki_code_$(date +%Y%m%d).tar.gz /var/www/wiki
```

### Автоматический backup (cron)

```bash
# Создайте скрипт backup
nano /root/backup.sh
```

Вставьте:
```bash
#!/bin/bash
mkdir -p /root/backups
pg_dump -U wiki_user wiki_db > /root/backups/wiki_db_$(date +%Y%m%d).sql
find /root/backups -name "wiki_db_*.sql" -mtime +7 -delete
```

Сохраните и добавьте в cron:
```bash
chmod +x /root/backup.sh
crontab -e
```

Добавьте строку (backup каждый день в 3:00):
```
0 3 * * * /root/backup.sh
```

### Мониторинг ресурсов

```bash
# Использование диска
df -h

# Использование RAM
free -h

# Процессы
htop   # (установите: apt install htop)

# Нагрузка на CPU
top
```

---

## 🔒 Безопасность

### Изменение паролей

**PostgreSQL:**
```bash
sudo -u postgres psql
ALTER USER wiki_user WITH PASSWORD 'НовыйПароль';
\q

# Обновите в /etc/systemd/system/wiki-backend.service
nano /etc/systemd/system/wiki-backend.service
# Измените строку Environment="DATABASE_URL=..."
systemctl daemon-reload
systemctl restart wiki-backend
```

**MinIO:**
```bash
nano /etc/systemd/system/minio.service
# Измените MINIO_ROOT_PASSWORD
systemctl daemon-reload
systemctl restart minio
```

### Дополнительная защита SSH

```bash
# Запретите root логин по паролю (только SSH-ключи)
nano /etc/ssh/sshd_config
```

Найдите и измените:
```
PermitRootLogin without-password
PasswordAuthentication no
```

Сохраните и перезапустите SSH:
```bash
systemctl restart sshd
```

⚠️ **Важно:** Сначала настройте SSH-ключи, иначе потеряете доступ!

---

## 🆘 Решение проблем

### Сайт не открывается

1. Проверьте статус Nginx:
```bash
systemctl status nginx
nginx -t
```

2. Проверьте firewall:
```bash
ufw status
```

3. Проверьте, слушает ли Nginx на порту 80:
```bash
netstat -tlnp | grep :80
```

### Backend API не работает

1. Проверьте статус backend:
```bash
systemctl status wiki-backend
journalctl -u wiki-backend -n 100
```

2. Проверьте, слушает ли backend на порту 8000:
```bash
curl http://localhost:8000/health
```

3. Проверьте зависимости Python:
```bash
source /var/www/wiki/venv/bin/activate
pip list
```

### PostgreSQL не подключается

1. Проверьте статус:
```bash
systemctl status postgresql
```

2. Проверьте подключение:
```bash
psql -U wiki_user -d wiki_db -h localhost
```

3. Проверьте pg_hba.conf:
```bash
cat /etc/postgresql/14/main/pg_hba.conf | grep "local.*all"
```

### MinIO не работает

1. Проверьте статус:
```bash
systemctl status minio
journalctl -u minio -n 50
```

2. Проверьте доступность:
```bash
curl http://localhost:9000/minio/health/live
```

### Изображения не загружаются

1. Проверьте права на папку MinIO:
```bash
ls -la /mnt/data/minio
chown -R minio-user:minio-user /mnt/data/minio
```

2. Проверьте bucket в MinIO Console:
```
http://ВАШ_IP:9001
```

3. Проверьте политику доступа к bucket "files"

---

## 📚 Дополнительные ресурсы

- **Панель Timeweb:** https://timeweb.com/my/
- **Документация Timeweb:** https://timeweb.cloud/docs/
- **Техподдержка Timeweb:** support@timeweb.ru или через панель управления
- **Сообщество poehali.dev:** https://t.me/+QgiLIa1gFRY4Y2Iy
- **Документация Nginx:** https://nginx.org/ru/docs/
- **Документация PostgreSQL:** https://www.postgresql.org/docs/
- **Документация MinIO:** https://min.io/docs/

---

## 🚀 Следующие шаги (опционально)

### Настройка мониторинга

**UptimeRobot (бесплатно):**
1. Зарегистрируйтесь на https://uptimerobot.com
2. Добавьте монитор для вашего сайта
3. Настройте уведомления на email/Telegram

### Настройка CDN (для ускорения)

**Cloudflare (бесплатно):**
1. Зарегистрируйтесь на https://cloudflare.com
2. Добавьте ваш домен
3. Измените DNS на Cloudflare nameservers
4. Включите proxy для вашего домена

### Увеличение производительности

**Redis для кэширования:**
```bash
apt install redis-server
systemctl enable redis-server
systemctl start redis-server
```

Настройте кэширование в backend функциях.

---

**🎉 Поздравляю! Ваш проект успешно перенесен на Timeweb VPS!**

При возникновении вопросов пишите в сообщество: https://t.me/+QgiLIa1gFRY4Y2Iy
