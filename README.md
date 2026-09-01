# 🛒 АІС «Злагода» (Zlagoda Supermarket AIS)

**Автоматизована інформаційна система для мережі супермаркетів «Злагода»** — комплексне клієнт-серверне рішення для автоматизації процесів обліку товарів, управління персоналом, роботи касирів (POS-термінал), дисконтної програми лояльності клієнтів та формування аналітичної звітності.

---

## 📌 Зміст

- [Основні можливості](#-основні-можливості)
- [Технологічний стек](#-технологічний-стек)
- [Архітектура бази даних](#-архітектура-бази-даних)
- [Структура проєкту](#-структура-проєкту)
- [Встановлення та запуск](#-встановлення-та-запуск)
  - [1. Клонування та налаштування змінних оточення](#1-клонування-та-налаштування-змінних-оточення)
  - [2. Запуск PostgreSQL через Docker](#2-запуск-postgresql-через-docker)
  - [3. Встановлення залежностей Python](#3-встановлення-залежностей-python)
  - [4. Ініціалізація та наповнення бази даних](#4-ініціалізація-та-наповнення-бази-даних)
  - [5. Запуск серверної частини](#5-запуск-серверної-частини)
  - [6. Запуск клієнтської частини](#6-запуск-клієнтської-частини)
- [Тестові облікові записи](#-тестові-облікові-записи)
- [Документація API](#-документація-api)
- [Безпека та конфіденційність](#-безпека-та-конфіденційність)

---

## 🌟 Основні можливості

### 👤 Роль «Менеджер»:
- **Управління персоналом:** перегляд списку працівників, додавання, редагування, фільтрація за роллю (касир/менеджер), сортування, пошук за прізвищем, аналіз ефективності касирів.
- **Управління номенклатурою товарів:** створення категорій, перегляд і редагування довідника товарів, перегляд хітів продажу.
- **Складський облік товарів у магазині:** облік партій товарів за UPC-кодами, контроль акційних товарів (`UPC_prom`), встановлення роздрібних цін, залишки на складах.
- **Програма лояльності (Картки клієнтів):** реєстрація та редагування дисконтних карток покупців із відсотком знижки, пошук та статистика.
- **Аналітика та звіти:** звіти з реалізації за період часу, розрахунок ПДВ, статистика продажів по касирах та магазину загалом.

### 💳 Роль «Касир»:
- **POS-термінал створення чеків:** оперативний пошук товарів за UPC або назвою, сканування та додавання у чек.
- **Дисконтна система:** автоматичне застосування відсотка знижки за номером картки постійного клієнта.
- **Автоматичний розрахунок:** проміжний підсумок, знижка, розрахунок ПДВ (20%), фінальна сума чека.
- **Друк та збереження чека:** автоматичне списання залишків товарів зі складу за допомогою SQL-тригерів.
- **Історія чеків:** перегляд власних закритих чеків за поточний день та за обраний період.

---

## 🛠 Технологічний стек

| Компонент | Технології |
|---|---|
| **Backend** | Python 3.13+, FastAPI, Uvicorn, Pydantic v2, asyncpg (Pure Async SQL), bcrypt, python-jose (JWT) |
| **Database** | PostgreSQL 15, PL/pgSQL тригери, представлення (Views), індекси, збережені процедури |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+ Modules), Bootstrap 5.3, Bootstrap Icons |
| **DevOps & Tools** | Docker, Docker Compose, Pipenv, Git |

---

## 🗄 Архітектура бази даних

База даних спроєктована на основі реляційної моделі з високою продуктивністю завдяки прямим асинхронним SQL-запитам через `asyncpg` та пулу з'єднань:

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : "contains"
    PRODUCT ||--o{ STORE_PRODUCT : "instantiated as"
    STORE_PRODUCT ||--o{ STORE_PRODUCT : "promotes (upc_prom)"
    EMPLOYEE ||--o{ CHECK : "creates"
    CUSTOMER_CARD ||--o{ CHECK : "applies discount"
    CHECK ||--|{ SALE : "includes"
    STORE_PRODUCT ||--o{ SALE : "sold in"

    CATEGORY {
        serial category_number PK
        varchar category_name UK
    }
    PRODUCT {
        serial id_product PK
        int category_number FK
        varchar product_name
        varchar manufacturer
        varchar characteristics
    }
    STORE_PRODUCT {
        varchar upc PK
        varchar upc_prom FK
        int id_product FK
        decimal selling_price
        int products_number
        boolean promotional_product
    }
    EMPLOYEE {
        varchar id_employee PK
        varchar password_hash
        varchar empl_surname
        varchar empl_name
        varchar empl_patronymic
        varchar empl_role
        decimal salary
        date date_of_birth
        date date_of_start
        varchar phone_number
        varchar city
        varchar street
        varchar zip_code
    }
    CUSTOMER_CARD {
        varchar card_number PK
        varchar cust_surname
        varchar cust_name
        varchar cust_patronymic
        varchar phone_number
        varchar city
        varchar street
        varchar zip_code
        int percent
    }
    CHECK {
        varchar check_number PK
        varchar id_employee FK
        varchar card_number FK
        timestamp print_date
        decimal sum_total
        decimal vat
    }
    SALE {
        varchar upc PK,FK
        varchar check_number PK,FK
        int product_number
        decimal selling_price
    }
```

### Ключові особливості БД:
1. **Тригер автоматичного списання залишків (`trigger_deduct_inventory`):** після кожної вставки рядка в таблицю `sale` автоматично зменшується кількість товару `products_number` у таблиці `store_product`.
2. **Індекси:** оптимізація пошуку за прізвищами працівників (`idx_employee_surname`), клієнтів (`idx_customer_surname`), назвами товарів (`idx_product_name`) та категорій (`idx_category_name`).
3. **Фонове автоочищення чеків:** у FastAPI реалізовано періодичну задачу, яка очищує чеки, старіші за 3 роки згідно з регламентом зберігання.

---

## 📁 Структура проєкту

```text
zlagoda_ais/
├── backend/
│   ├── api/                    # Роутери FastAPI (REST API ендпоінти)
│   │   ├── auth.py             # Авторизація та генерація JWT
│   │   ├── categories.py       # Категорії товарів
│   │   ├── checks.py           # Чеки, продажі та аналітика
│   │   ├── customer_cards.py   # Картки постійних клієнтів
│   │   ├── dep.py              # Залежності та перевірка ролей
│   │   ├── employees.py        # Працівники та статистика
│   │   ├── products.py         # Загальний каталог товарів
│   │   └── store_product.py    # Товари в магазині (партії/UPC)
│   ├── core/                   # Ядро бекенду
│   │   ├── database.py         # Створення пулу з'єднань asyncpg
│   │   └── security.py         # Хешування паролів (bcrypt) та JWT
│   ├── database/               # Скрипти БД
│   │   ├── init_db.py          # Створення таблиць, тригерів та індексів
│   │   └── seed.py             # Наповнення тестовими даними
│   ├── schemas/                # Валідація Pydantic v2
│   ├── services/               # Бізнес-логіка
│   └── main.py                 # Точка входу FastAPI додатку
├── frontend/
│   ├── static/
│   │   ├── css/style.css       # Стилі інтерфейсу
│   │   └── js/
│   │       ├── api.js          # Клієнт взаємодії з REST API (fetch/JWT)
│   │       ├── filters.js      # Логіка фільтрації та модальних вікон
│   │       ├── main.js         # Основна логіка рендерингу та таблиць
│   │       ├── pos.js          # Логіка POS-терміналу касира
│   │       └── utils.js        # Утиліти та форматування
│   └── templates/
│       ├── cashier/            # Сторінки касира (home, POS-термінал)
│       ├── manager/            # Сторінки менеджера (персонал, категорії)
│       └── shared/             # Спільні сторінки (login, товари, чеки, клієнти)
├── .env.example                # Шаблон конфігурації оточення
├── .gitignore                  # Налаштування виключень Git
├── docker-compose.yml          # Конфігурація PostgreSQL у Docker
├── Pipfile                     # Залежності Python (Pipenv)
└── README.md                   # Документація проєкту
```

---

## 🚀 Встановлення та запуск

### 1. Клонування та налаштування змінних оточення

Створіть власний файл `.env` на основі шаблону `.env.example`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Вміст `.env`:
```env
DATABASE_URL=postgresql://zlagoda_user:1111@localhost:5433/zlagoda_db
SECRET_KEY=b9f8e7d6c5b4a392817263544536271809a8b7c6d5e4f3g2h1j0k9l8m7n6o5p4
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### 2. Запуск PostgreSQL через Docker

Запустіть контейнер з базою даних:

```powershell
docker-compose up -d
```

Перевірити статус контейнера:
```powershell
docker ps
```

---

### 3. Встановлення залежностей Python

Рекомендується використовувати `pipenv`:

```powershell
# Встановлення pipenv (якщо ще не встановлено)
py -m pip install pipenv

# Встановлення залежностей проєкту
pipenv install --dev
```

Або через звичайний `pip`:
```powershell
py -m pip install fastapi uvicorn asyncpg python-jose[cryptography] python-multipart pydantic pydantic-settings bcrypt jinja2 pytest httpx
```

---

### 4. Ініціалізація та наповнення бази даних

Виконайте створення структури таблиць:
```powershell
pipenv run py -m backend.database.init_db
```

Наповніть базу тестовими категоріями, товарами, працівниками, клієнтами та згенерованими чеками:
```powershell
pipenv run py -m backend.database.seed
```

---

### 5. Запуск серверної частини

Запустіть FastAPI сервер:

```powershell
pipenv run uvicorn backend.main:app --reload --port 8000
```

Сервер стане доступним за адресою: `http://localhost:8000`

---

### 6. Запуск клієнтської частини

Фронтенд побудований на стандартному стеку HTML/JS/CSS.
- Відкрийте файл `frontend/templates/shared/login.html` у браузері або через розширення **Live Server** у VS Code / PyCharm.
- Використовуйте порт за замовчуванням (API запити налаштовані на `http://localhost:8000`).

---

## 🔐 Тестові облікові записи

Для входу в систему створено попередньо налаштовані тестові акаунти (пароль для всіх однаковий: `123`):

| Табельний номер (ID) | ПІБ | Роль | Пароль |
|---|---|---|---|
| `1003009` | Мельник Анна Олексіївна | **Менеджер** | `123` |
| `13092007` | Ткаченко Максим Петрович | **Менеджер** | `123` |
| `1337` | Коваленко Роман Сергійович | **Менеджер** | `123` |
| `99001` | Кравченко Віталій Миколайович | **Менеджер** | `123` |
| `54321` | Сидоренко Іван Петрович | **Касир** | `123` |
| `11223` | Коваль Марія Олегівна | **Касир** | `123` |
| `33445` | Петренко Олександр Сергійович | **Касир** | `123` |
| `66778` | Іванова Наталія Вікторівна | **Касир** | `123` |

---

## 📖 Документація API

FastAPI автоматично генерує інтерактивну документацію до всіх ендпоінтів:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Основні групи ендпоінтів:
- `POST /auth/login` — Авторизація за формою OAuth2 (отримання Bearer токена та ролі).
- `GET/POST/PUT/DELETE /categories/` — Управління категоріями товарів.
- `GET/POST/PUT/DELETE /products/` — Загальний каталог продукції.
- `GET/POST/PUT/DELETE /store-products/` — Товари в магазині (UPC, ціни, наявність, акції).
- `GET/POST/PUT/DELETE /customer-cards/` — Картки постійних покупців та знижки.
- `GET/POST/DELETE /checks/` — Чеки, деталі продажів та звіти по періодах/касирах.
- `GET/POST/PUT/DELETE /employees/` — Працівники, контактні дані та зарплати.

---

## 🔒 Безпека та конфіденційність

1. **Захист паролів:** Усі паролі хешуються алгоритмом `bcrypt` із сіллю. У базі не зберігаються паролі у відкритому вигляді.
2. **Автентифікація:** Використовуються JWT-токени (`HS256`) з обмеженим терміном дії (TTL).
3. **Авторизація:** Доступ до створення/редагування товарів, перегляду зарплат та звітності суворо обмежений роллю `Менеджер`.
4. **Конфіденційність:** Файл `.env` виключено з системи контролю версій (`.gitignore`), реальні секрети та персональні дані видалено з історії репозиторію.
