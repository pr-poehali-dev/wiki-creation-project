import { API_URLS } from '@/config/api';
import wikiItemsData from '@/data/wikiItems.json';
import guidesData from '@/data/guides.json';

const SUPER_ADMIN_EMAIL = "ad.alex1995@yandex.ru";
const SUPER_ADMIN_PASSWORD = ""; // Пустой пароль для суперадмина

/**
 * Инициализация данных при первом запуске
 * Создает суперадмина, загружает предметы и гайды
 */
export async function initializeData(): Promise<void> {
  console.log('🚀 Начинаю инициализацию данных...');

  try {
    // 1. Проверяем/создаем суперадмина
    console.log('1️⃣ Проверяю суперадмина...');
    const loginResponse = await fetch(`${API_URLS.AUTH}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Суперадмин найден:', loginData.email);
      
      const token = loginData.token;
      const email = loginData.email;

      // 2. Загружаем предметы
      console.log('2️⃣ Загружаю предметы...');
      const itemsResponse = await fetch(`${API_URLS.DATA_MANAGER}?type=items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
          'X-Admin-Email': email
        },
        body: JSON.stringify(wikiItemsData)
      });

      if (itemsResponse.ok) {
        console.log('✅ Предметы загружены');
      } else {
        console.warn('⚠️ Не удалось загрузить предметы:', await itemsResponse.text());
      }

      // 3. Загружаем гайды
      console.log('3️⃣ Загружаю гайды...');
      const guidesResponse = await fetch(`${API_URLS.DATA_MANAGER}?type=guides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
          'X-Admin-Email': email
        },
        body: JSON.stringify(guidesData)
      });

      if (guidesResponse.ok) {
        console.log('✅ Гайды загружены');
      } else {
        console.warn('⚠️ Не удалось загрузить гайды:', await guidesResponse.text());
      }

      console.log('🎉 Инициализация завершена успешно!');
    } else {
      console.log('ℹ️ Суперадмин еще не создан или требуется регистрация');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }
}

// Функция экспортируется для ручного вызова из админки