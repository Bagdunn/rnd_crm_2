# R&D CRM - Система управління компонентами

Повноцінна система управління компонентами для R&D відділів з інтерактивним складом, пресетами та аутентифікацією користувачів.

## 🚀 Особливості

### 📦 **Управління складом**
- **Інтерактивний 3D склад** - 6x3 сітка з візуальними комірками
- **Кольорове кодування** - різні кольори для групування компонентів
- **Розташування** - підтримка формату A1, B2:red1, A1:BoxName1(/2/3)
- **Анімації** - зсув сітки при виборі комірки

### 🧩 **Компоненти**
- **Повне CRUD** - додавання, редагування, видалення
- **Категорії** - організація по типах
- **Властивості** - динамічні характеристики
- **Фільтрація** - по назві, категорії, розташуванню, кількості
- **Сортування** - по всіх стовпцях

### 🎯 **Пресети**
- **Комплекти компонентів** - готові набори для проектів
- **Список компонентів** - відображення всього вмісту
- **Операції** - перевірка наявності, списання, редагування

### 👥 **Користувачі**
- **3 ролі** - admin, default_user, global_user
- **Аутентифікація** - JWT токени
- **Безпека** - хешування паролів, валідація

### 📱 **Мобільна версія**
- **Адаптивний дизайн** - працює на всіх пристроях
- **Горизонтальний скрол** - для таблиць на мобільних
- **Оптимізовані елементи** - компактні кнопки та відступи

## 🛠️ Технології

### **Frontend**
- HTML5, CSS3, JavaScript (ES6+)
- Material Icons
- Responsive Design
- Local Storage для стану

### **Backend**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcrypt для паролів

### **DevOps**
- Docker & Docker Compose
- Nginx для статичних файлів
- Миграції бази даних

## 🚀 Розгортання на Railway

### **1. Підготовка**
```bash
# Клонування репозиторію
git clone https://github.com/Bagdunn/rnd_crm_2.git
cd rnd_crm_2
```

### **2. Змінні середовища**
Створіть файл `.env` на основі `env.example`:

```env
# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=rnd_crm
DB_USER=your-username
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3000
NODE_ENV=production
```

### **3. Railway Deployment**

#### **Варіант A: Автоматичне розгортання**
1. Підключіть GitHub репозиторій до Railway
2. Railway автоматично виявить `docker-compose.yml`
3. Додайте змінні середовища в Railway Dashboard
4. Railway автоматично розгорне всі сервіси

#### **Варіант B: Ручне розгортання**
```bash
# Встановлення Railway CLI
npm install -g @railway/cli

# Логін
railway login

# Ініціалізація проекту
railway init

# Додавання PostgreSQL
railway add postgresql

# Розгортання
railway up
```

### **4. Налаштування бази даних**
```bash
# Підключення до Railway PostgreSQL
railway connect postgresql

# Запуск міграцій
railway run node backend/migrations/run-all-migrations.js

# Запуск seed даних
railway run node backend/seeds/run-seeds.js
```

## 📊 Структура проекту

```
rnd_crm/
├── backend/                 # Node.js API
│   ├── config/             # Конфігурація БД
│   ├── middleware/         # Auth middleware
│   ├── migrations/         # SQL міграції
│   ├── routes/            # API endpoints
│   ├── seeds/             # Тестові дані
│   └── server.js          # Основний сервер
├── frontend/              # Статичний фронтенд
│   ├── assets/           # CSS, JS, зображення
│   ├── index.html        # Головна сторінка
│   └── login.html        # Сторінка входу
├── docker-compose.yml    # Docker конфігурація
└── README.md            # Документація
```

## 🔐 Тестові користувачі

| Username | Password | Role | Опис |
|----------|----------|------|------|
| `admin` | `admin123` | admin | Системний адміністратор |
| `user1` | `user123` | default_user | Звичайний користувач |
| `user2` | `user123` | default_user | Звичайний користувач |
| `global1` | `global123` | global_user | Глобальний користувач |
| `global2` | `global123` | global_user | Глобальний користувач |

## 🎯 API Endpoints

### **Аутентифікація**
- `POST /api/auth/login` - Вхід в систему
- `POST /api/auth/register` - Реєстрація (admin only)
- `GET /api/auth/profile` - Профіль користувача
- `GET /api/auth/users` - Список користувачів (admin only)

### **Компоненти**
- `GET /api/items` - Список компонентів
- `POST /api/items` - Додати компонент
- `PUT /api/items/:id` - Редагувати компонент
- `DELETE /api/items/:id` - Видалити компонент
- `GET /api/items/warehouse/data` - Дані для складу

### **Категорії**
- `GET /api/categories` - Список категорій
- `POST /api/categories` - Додати категорію
- `PUT /api/categories/:id` - Редагувати категорію
- `DELETE /api/categories/:id` - Видалити категорію

### **Пресети**
- `GET /api/presets` - Список пресетів
- `POST /api/presets` - Створити пресет
- `PUT /api/presets/:id` - Редагувати пресет
- `DELETE /api/presets/:id` - Видалити пресет

## 🐳 Docker Commands

```bash
# Локальний запуск
docker-compose up -d

# Перебудова
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Перегляд логів
docker-compose logs -f

# Зупинка
docker-compose down
```

## 📝 Ліцензія

MIT License - використовуйте вільно для комерційних та некомерційних проектів.

## 🤝 Внесок

1. Fork репозиторій
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push до branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📞 Підтримка

Якщо у вас виникли питання або проблеми:
- Створіть Issue в GitHub
- Перевірте документацію
- Перегляньте логи Railway

---

**Розроблено з ❤️ для R&D відділів**