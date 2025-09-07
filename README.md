# R&D CRM - Система управління компонентами

Веб-додаток для управління компонентами та інструментами в R&D відділі. Система забезпечує облік, пошук, списання компонентів та управління закупівлями.

## 🚀 Швидкий старт

### Вимоги
- Docker
- Docker Compose

### Запуск

1. **Клонуйте репозиторій:**
```bash
git clone <repository-url>
cd rnd_crm
```

2. **Запустіть систему:**
```bash
docker-compose up -d
```

3. **Відкрийте браузер:**
```
http://localhost
```

4. **Запустіть міграції та seed дані:**
```bash
# Запуск міграцій
docker-compose exec backend npm run migrate

# Запуск seed даних
docker-compose exec backend npm run seed
```

## 📋 Функціональність

### 🏠 Головна сторінка
- Загальна статистика по компонентам та інструментам
- Лічильники загальної кількості предметів
- Індикатори низької кількості
- Швидкий доступ до основних функцій

### 📦 Управління компонентами
- **Додавання компонентів** з гнучкими властивостями
- **Списання компонентів** з логуванням
- **Фільтрація та пошук** по назві, розташуванню, властивостям
- **Пагінація** для великих списків
- **Кольорове кодування** кількості (зелений/жовтий/червоний)

### 🎯 Пресети
- **Створення пресетів** для стандартних комплектів
- **Перевірка наявності** компонентів у пресеті
- **Масове списання** з пресету
- **Управління** (створення, редагування, видалення)

### 🛒 Закупівлі
- **Створення запитів** на закупівлю
- **Управління статусами** (очікує, затверджено, завершено, скасовано)
- **Автоматичне додавання** компонентів при завершенні закупівлі
- **Фільтрація** за статусом та дедлайном

### 📊 Історія та аналітика
- **Лог всіх операцій** (списання, додавання)
- **Фільтрація транзакцій** за типом та користувачем
- **Статистика використання** компонентів

## 🏗️ Архітектура

### Backend
- **Node.js + Express** - веб-сервер
- **PostgreSQL** - база даних
- **RESTful API** - архітектура
- **Валідація** - express-validator
- **Безпека** - helmet, CORS, rate limiting

### Frontend
- **Vanilla JavaScript** - без фреймворків
- **Material Design** - мінімалістичний UI
- **Responsive** - адаптивний дизайн
- **SPA** - односторінковий додаток

### База даних
- **PostgreSQL** з оптимізованими індексами
- **JSONB** для гнучких властивостей
- **Транзакції** для критичних операцій
- **Міграції** для управління схемою

## 🔧 API Endpoints

### Компоненти
- `GET /api/items` - список компонентів з фільтрацією
- `POST /api/items` - створення компонента
- `PUT /api/items/:id` - оновлення компонента
- `DELETE /api/items/:id` - видалення компонента
- `POST /api/items/:id/withdraw` - списання компонента

### Пресети
- `GET /api/presets` - список пресетів
- `POST /api/presets` - створення пресету
- `GET /api/presets/:id/check` - перевірка наявності
- `POST /api/presets/:id/withdraw` - масове списання

### Закупівлі
- `GET /api/purchase-requests` - список запитів
- `POST /api/purchase-requests` - створення запиту
- `PUT /api/purchase-requests/:id/status` - оновлення статусу
- `POST /api/purchase-requests/:id/complete` - завершення закупівлі

## 🐳 Docker

### Сервіси
- **postgres** - база даних PostgreSQL
- **backend** - Node.js API сервер
- **frontend** - Nginx з статичними файлами

### Порты
- **80** - Frontend (Nginx)
- **3000** - Backend API
- **5432** - PostgreSQL

## 📁 Структура проекту

```
rnd_crm/
├── docker-compose.yml          # Docker композиція
├── backend/                    # Backend код
│   ├── package.json           # Залежності
│   ├── server.js              # Головний сервер
│   ├── config/                # Конфігурація
│   ├── routes/                # API маршрути
│   ├── migrations/            # Міграції БД
│   └── seeds/                 # Seed дані
├── frontend/                   # Frontend код
│   ├── index.html             # Головна сторінка
│   ├── assets/css/style.css   # Стилі
│   ├── assets/js/app.js       # JavaScript
│   └── Dockerfile             # Docker образ
└── README.md                   # Документація
```

## 🚀 Розробка

### Локальна розробка

1. **Backend:**
```bash
cd backend
npm install
npm run dev
```

2. **Frontend:**
```bash
cd frontend
# Відкрийте index.html в браузері
# Або використовуйте live server
```

3. **База даних:**
```bash
# Запустіть PostgreSQL локально або через Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
```

### Міграції

```bash
# Створення нової міграції
cd backend/migrations
# Створіть новий .sql файл з номером

# Запуск міграцій
npm run migrate
```

### Seed дані

```bash
# Запуск seed даних
npm run seed
```

## 🔒 Безпека

- **Валідація** вхідних даних
- **SQL injection** захист через параметризовані запити
- **CORS** налаштування
- **Rate limiting** для API
- **Security headers** через Helmet

## 📱 Responsive Design

- **Desktop first** підхід
- **Адаптивність** для планшетів та мобільних
- **Material Design** принципи
- **Touch-friendly** інтерфейс

## 🧪 Тестування

### Seed дані включають:
- Приклади компонентів (Arduino, ESP32, сервоприводи)
- Приклади пресетів (FPV дрон, робот-маніпулятор)
- Приклади запитів на закупівлю

### Тестування функцій:
1. Додавання компонентів
2. Списання компонентів
3. Створення пресетів
4. Управління закупівлями
5. Перегляд історії транзакцій

## 🚀 Розгортання

### Production

1. **Оновіть environment variables:**
```bash
# В docker-compose.yml
JWT_SECRET=your-secure-secret
DB_PASSWORD=your-secure-password
```

2. **Запустіть:**
```bash
docker-compose -f docker-compose.yml up -d
```

3. **Налаштуйте reverse proxy** (Nginx/Apache) якщо потрібно

### Backup

```bash
# Backup бази даних
docker-compose exec postgres pg_dump -U postgres rnd_crm > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres rnd_crm < backup.sql
```

## 🤝 Внесок

1. Fork проект
2. Створіть feature branch
3. Commit зміни
4. Push в branch
5. Створіть Pull Request

## 📄 Ліцензія

MIT License - дивіться LICENSE файл для деталей

## 🆘 Підтримка

При виникненні проблем:

1. Перевірте логи: `docker-compose logs`
2. Перевірте статус сервісів: `docker-compose ps`
3. Перезапустіть: `docker-compose restart`
4. Створіть issue в репозиторії

## 🔮 Майбутні функції

- [ ] Експорт в Excel/CSV
- [ ] QR коди для компонентів
- [ ] Нотифікації про низьку кількість
- [ ] API для інтеграції
- [ ] Backup/restore функціонал
- [ ] Розширена аналітика
- [ ] Користувацькі ролі та права
- [ ] Audit log для всіх дій

---

**R&D CRM** - простий та ефективний спосіб управління компонентами вашого R&D відділу! 🚀
