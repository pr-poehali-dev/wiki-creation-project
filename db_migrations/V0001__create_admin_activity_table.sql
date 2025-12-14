-- Таблица для отслеживания активности администраторов
CREATE TABLE IF NOT EXISTS admin_activity (
    email VARCHAR(255) PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL,
    last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
    login_count INTEGER NOT NULL DEFAULT 0,
    visit_count INTEGER NOT NULL DEFAULT 0
);

-- Индекс для быстрого поиска онлайн пользователей
CREATE INDEX idx_admin_activity_last_seen ON admin_activity(last_seen);
