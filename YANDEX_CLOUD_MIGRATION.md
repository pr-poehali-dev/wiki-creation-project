# Миграция на Yandex Cloud Functions

Полная инструкция по переносу бэкенд-функций с poehali.dev на Yandex Cloud.

## Преимущества Yandex Cloud

- ✅ **Бесплатный тир**: 1 млн вызовов и 10 ГБ трафика в месяц
- ✅ **60 дней trial**: 4000₽ на счет при регистрации
- ✅ **Совместимость**: код работает без изменений
- ✅ **Документация**: на русском языке
- ✅ **Поддержка**: российская платформа с быстрой поддержкой

---

## Шаг 1: Регистрация в Yandex Cloud

1. Перейдите на https://cloud.yandex.ru
2. Нажмите **"Попробовать бесплатно"**
3. Войдите через Яндекс ID (или создайте новый)
4. Привяжите банковскую карту (спишется и вернется 1₽ для проверки)
5. Получите **4000₽ на 60 дней** + бесплатный тир навсегда

---

## Шаг 2: Создание каталога и сервисного аккаунта

### 2.1 Создайте каталог
```bash
# В веб-консоли: Главное меню → Создать каталог
Название: devilrust-backend
```

### 2.2 Создайте сервисный аккаунт
```bash
# В веб-консоли: Каталог → Сервисные аккаунты → Создать
Название: devilrust-sa
Роли: 
  - functions.functionInvoker (для вызова функций)
  - storage.editor (для работы с S3)
```

### 2.3 Создайте статический ключ доступа
```bash
# Сервисный аккаунт → Создать новый ключ → Статический ключ доступа
# СОХРАНИТЕ:
AWS_ACCESS_KEY_ID: YCAJE...
AWS_SECRET_ACCESS_KEY: YCM...
```

---

## Шаг 3: Установка Yandex Cloud CLI

### MacOS / Linux:
```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### Windows:
```powershell
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')
```

### Инициализация CLI:
```bash
yc init
# Выберите каталог devilrust-backend
# Выберите зону: ru-central1-a
```

---

## Шаг 4: Создание Object Storage (S3)

### 4.1 Создайте бакет
```bash
# В веб-консоли: Object Storage → Создать бакет
Имя: devilrust-storage
Класс хранилища: Стандартное
Доступ на чтение: Публичный
```

### 4.2 Настройте CORS
```bash
# Бакет → Настройки → CORS
```

Добавьте правило:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Шаг 5: Миграция данных (guides.json)

### 5.1 Установите AWS CLI (для работы с S3)
```bash
# MacOS
brew install awscli

# Linux
sudo apt install awscli

# Windows - скачайте с aws.amazon.com/cli
```

### 5.2 Настройте AWS CLI для Yandex Cloud
```bash
aws configure --profile yandex
# AWS Access Key ID: <ваш YCAJE...>
# AWS Secret Access Key: <ваш YCM...>
# Default region: ru-central1
# Default output format: json
```

### 5.3 Скачайте текущий guides.json
```bash
# Если у вас есть доступ к текущему S3
aws s3 cp s3://old-bucket/wiki/guides.json ./guides.json --profile old-profile
```

### 5.4 Загрузите в Yandex Object Storage
```bash
aws s3 cp guides.json s3://devilrust-storage/wiki/guides.json \
  --profile yandex \
  --endpoint-url=https://storage.yandexcloud.net \
  --content-type application/json
```

---

## Шаг 6: Деплой функций

### 6.1 Функция: auth-admin

```bash
cd backend/auth-admin

# Создайте функцию
yc serverless function create --name=auth-admin

# Разверните версию
yc serverless function version create \
  --function-name=auth-admin \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --source-path=.
```

### 6.2 Функция: wiki-items

```bash
cd ../wiki-items

yc serverless function create --name=wiki-items

yc serverless function version create \
  --function-name=wiki-items \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --environment AWS_ACCESS_KEY_ID=<ваш_ключ> \
  --environment AWS_SECRET_ACCESS_KEY=<ваш_секрет> \
  --source-path=.
```

### 6.3 Функция: guides

```bash
cd ../guides

yc serverless function create --name=guides

yc serverless function version create \
  --function-name=guides \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=256m \
  --execution-timeout=30s \
  --environment AWS_ACCESS_KEY_ID=<ваш_ключ> \
  --environment AWS_SECRET_ACCESS_KEY=<ваш_секрет> \
  --source-path=.
```

---

## Шаг 7: Настройка публичного доступа

### Для каждой функции выполните:
```bash
# Сделать функцию публичной
yc serverless function allow-unauthenticated-invoke auth-admin
yc serverless function allow-unauthenticated-invoke wiki-items
yc serverless function allow-unauthenticated-invoke guides

# Получить URL
yc serverless function get auth-admin --format=json | grep http_invoke_url
yc serverless function get wiki-items --format=json | grep http_invoke_url
yc serverless function get guides --format=json | grep http_invoke_url
```

Сохраните полученные URL — они понадобятся для .env

---

## Шаг 8: Обновление кода бэкенда

### 8.1 Обновите endpoint для S3 во всех функциях

В `backend/guides/index.py` и `backend/wiki-items/index.py`:
```python
def get_s3_client():
    return boto3.client('s3',
        endpoint_url='https://storage.yandexcloud.net',  # ← ИЗМЕНИТЬ
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
```

### 8.2 Обновите CDN URL

В `backend/guides/index.py` (строка ~183):
```python
# Старый URL:
cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"

# Новый URL:
cdn_url = f"https://storage.yandexcloud.net/devilrust-storage/{unique_filename}"
```

### 8.3 Передеплойте функции с изменениями
```bash
cd backend/guides
yc serverless function version create \
  --function-name=guides \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=256m \
  --execution-timeout=30s \
  --environment AWS_ACCESS_KEY_ID=<ваш_ключ> \
  --environment AWS_SECRET_ACCESS_KEY=<ваш_секрет> \
  --source-path=.
```

---

## Шаг 9: Обновление Frontend

### 9.1 Создайте .env файл
```bash
# В корне проекта создайте .env
VITE_AUTH_URL=https://functions.yandexcloud.net/d4e...ваш-id-auth
VITE_ITEMS_URL=https://functions.yandexcloud.net/d4e...ваш-id-items
VITE_GUIDES_URL=https://functions.yandexcloud.net/d4e...ваш-id-guides
```

### 9.2 Пересоберите проект
```bash
npm run build
# или
bun run build
```

### 9.3 Опубликуйте новую версию
```bash
# Если используете poehali.dev — просто коммит
git add .
git commit -m "Migration to Yandex Cloud"
git push
```

---

## Шаг 10: Тестирование

### Проверьте каждую функцию:

```bash
# 1. Auth
curl https://your-auth-url.yandexcloud.net

# 2. Items
curl https://your-items-url.yandexcloud.net

# 3. Guides
curl https://your-guides-url.yandexcloud.net
```

Откройте ваш сайт и проверьте:
- ✅ Загрузка предметов Wiki
- ✅ Загрузка гайдов
- ✅ Авторизация в админке
- ✅ Загрузка изображений

---

## Стоимость (примерная)

При текущей нагрузке (предполагаем 10,000 визитов в месяц):

| Сервис | Использование | Стоимость |
|--------|--------------|-----------|
| Cloud Functions | ~30,000 вызовов | **0₽** (free tier) |
| Object Storage | 1 ГБ данных | **~2₽/мес** |
| Трафик | 10 ГБ | **~150₽/мес** |
| **ИТОГО** | | **~152₽/мес** |

**Первые 60 дней:** полностью бесплатно за счет 4000₽ гранта

---

## Автоматизация деплоя (бонус)

Создайте скрипт `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying to Yandex Cloud..."

# Auth
cd backend/auth-admin
yc serverless function version create \
  --function-name=auth-admin \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --source-path=.

# Items
cd ../wiki-items
yc serverless function version create \
  --function-name=wiki-items \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --environment AWS_ACCESS_KEY_ID=$YC_ACCESS_KEY \
  --environment AWS_SECRET_ACCESS_KEY=$YC_SECRET_KEY \
  --source-path=.

# Guides
cd ../guides
yc serverless function version create \
  --function-name=guides \
  --runtime=python311 \
  --entrypoint=index.handler \
  --memory=256m \
  --execution-timeout=30s \
  --environment AWS_ACCESS_KEY_ID=$YC_ACCESS_KEY \
  --environment AWS_SECRET_ACCESS_KEY=$YC_SECRET_KEY \
  --source-path=.

echo "✅ Deployment complete!"
```

---

## Полезные ссылки

- 📚 [Документация Cloud Functions](https://cloud.yandex.ru/docs/functions/)
- 📚 [Object Storage документация](https://cloud.yandex.ru/docs/storage/)
- 💬 [Telegram-чат поддержки](https://t.me/YandexCloudRu)
- 🎯 [Калькулятор стоимости](https://cloud.yandex.ru/prices)

---

## Troubleshooting

### Ошибка: "Access Denied"
```bash
# Проверьте права сервисного аккаунта
yc iam service-account list-access-bindings devilrust-sa
```

### Ошибка: "Module not found"
```bash
# Убедитесь что requirements.txt в папке функции
ls backend/guides/requirements.txt
```

### Ошибка: CORS
```bash
# Проверьте настройки CORS в Object Storage
# Бакет → Настройки → CORS → Добавьте правило AllowedOrigins: ["*"]
```

---

## Следующие шаги

После успешной миграции:
1. ✅ Удалите старые URL из кода (если всё работает)
2. ✅ Настройте мониторинг в Yandex Cloud Console
3. ✅ Включите логирование для отладки
4. ✅ Рассмотрите использование API Gateway для единого endpoint

Вопросы? Пишите в чат проекта или в поддержку Yandex Cloud!
