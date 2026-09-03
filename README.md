<div align="center">

# 🛒 АІС «Злагода» (Zlagoda Supermarket AIS)

**Високонавантажена автоматизована інформаційна система для мережі роздрібної торгівлі супермаркетів «Злагода»**

*Комплексне клієнт-серверне рішення для обліку товарів, складської логістики, POS-терміналу касирів, дисконтної програми лояльності, кадрового менеджменту та фінансово-аналітичної звітності.*

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.13+" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 15" />
  <img src="https://img.shields.io/badge/asyncpg-Pure_Async_SQL-2C3E50?style=for-the-badge&logo=postgresql&logoColor=white" alt="asyncpg" />
  <img src="https://img.shields.io/badge/Pydantic-v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic v2" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap 5.3" />
  <img src="https://img.shields.io/badge/Security-JWT_%26_Bcrypt-blueviolet?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT & Bcrypt" />
</p>

[📌 Про проєкт](#-про-проєкт-та-бізнес-цінність) •
[⚡ Інженерні особливості](#-ключові-інженерні-особливості) •
[🛠 Стек технологій](#-технологічний-стек) •
[📐 Архітектура](#-архітектура-системи-та-бази-даних) •
[👥 Модулі та Ролі](#-функціональні-модулі) •
[🚀 Швидкий старт](#-інструкція-зі-встановлення-та-запуску) •
[🔐 Тестові акаунти](#-тестові-облікові-записи) •
[📖 API Документація](#-документація-api)

---

</div>

## 💼 Про проєкт та бізнес-цінність

**АІС «Злагода»** — це промислово-орієнтована інформаційна система, створена для оптимізації ключових бізнес-процесів роздрібного торговельного підприємства. Проєкт вирішує типові проблеми роздрібних мереж: розсинхронізацію складських залишків, повільне обслуговування на касах, неефективний контроль акційних партій та відсутність оперативної звітності.

### Основні бізнес-переваги:
- **Миттєве обслуговування покупців (POS):** зручний інтерфейс касира для швидкого формування чеків за штрихкодами (UPC), автоматичного перерахунку знижок за картками постійних клієнтів та друку чеків.
- **Точний складський облік у реальному часі:** автоматичне списання залишків на рівні бази даних (тригери PL/pgSQL) виключає людський фактор і race conditions.
- **Підтримка акційного асортименту:** гнучкий зв'язок між звичайними та акційними товарами (`upc_prom`) з окремим ціноутворенням.
- **Глибока аналітика для керівництва:** підрахунок виторгу за періодами, статистика продажів окремих категорій і брендів, визначення хітів продажу через математичний апарат реляційного ділення.

---

## 📷 Знімки екрану

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/08c42f5f-1d35-4386-b3b3-aec41f658fdf" width="200" alt="Фото 1"></td>
    <td><img src="https://github.com/user-attachments/assets/d8f2be08-7437-4c7b-9018-4e406828935f" width="200" alt="Фото 2"></td>
    <td><img src="https://github.com/user-attachments/assets/8dde8aca-32bb-42ee-9a87-024b28e27acd" width="200" alt="Фото 3"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/478ddf15-2dc9-409e-aa7b-1c2d27d17581" width="200" alt="Фото 4"></td>
    <td><img src="https://github.com/user-attachments/assets/66eb27e3-ee13-4b45-bcd2-4ff146271b63" width="200" alt="Фото 5"></td>
    <td><img src="https://github.com/user-attachments/assets/32d3fc25-308e-4504-b698-e3675573d1d3" width="200" alt="Фото 6"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ccb20a1b-3036-42d1-aa31-a4cfdf92e9cd" width="200" alt="Фото 7"></td>
    <td><img src="https://github.com/user-attachments/assets/c84bfcdc-b45b-403a-a52c-01dba48af616" width="200" alt="Фото 8"></td>
    <td><img src="https://github.com/user-attachments/assets/35419aa9-7dc3-4d56-b6f0-cbe9975d0646" width="200" alt="Фото 9"></td>
  </tr>
</table>

---

## ⚡ Ключові інженерні особливості

### 🚀 1. Pure Async SQL & High-Throughput Архітектура
Замість важких ORM (як-от SQLAlchemy чи Tortoise), взаємодія з базою реалізована через **`asyncpg`** — найшвидший асинхронний драйвер PostgreSQL для Python.
- Робота через **Connection Pool** для оптимізації відкриття з'єднань під високим навантаженням.
- Повний контроль над планами виконання SQL-запитів (`EXPLAIN ANALYZE`).
- Параметризовані SQL-запити (`$1, $2, ...`), що на 100% захищають від **SQL Injection**.

### 🛡 2. ACID-транзакції та цілісність даних
Створення фіскального чека оформлюється як єдина неподільна транзакція (`conn.transaction()`):
1. Генерація та блокування унікального номера чека.
2. Валідація наявності товару на полицях магазину (`products_number >= item.quantity`).
3. Розрахунок персональної знижки клієнта за номером картки.
4. Обчислення суми ПДВ (20%) та збереження заголовка чека.
5. Пакетна вставка рядків продажу (`conn.executemany`) та активація тригера списання.
*У разі збою на будь-якому кроці транзакція автоматично відкочується без пошкодження даних.*

### ⚙️ 3. Складна реляційна логіка на рівні СУБД
- **PL/pgSQL Тригер (`trigger_deduct_inventory`):** після кожної транзакції продажу в таблиці `sale` тригер автоматично коригує залишкову кількість одиниць у таблиці `store_product`.
- **Реляційне ділення (Relational Division):** аналітичні запити використовують патерн подвійного заперечення (`NOT EXISTS ... NOT EXISTS`) для визначення:
  - Товарів-бестселерів, що були продані **всіма без винятку касирами**.
  - Касирів, які реалізували **всі товари конкретного бренду/виробника**.
- **Індексування:** B-Tree індекси на полях прізвищ працівників (`idx_employee_surname`), клієнтів (`idx_customer_surname`), найменувань товарів (`idx_product_name`) та категорій (`idx_category_name`).
- **Спеціалізовані Views:** представлення `view_store_inventory` для денормалізованого читання товарних залишків без надлишкових JOIN-ів на стороні клієнта.

### 🧹 4. Фоновий воркер життєвого циклу даних (Data Retention)
У FastAPI Lifespan імплементовано довготривалий фоновий процес `cleanup_old_checks`. Згідно з регламентом зберігання первинної фінансової документації, чеки, старіші за 3 роки, автоматично вичищаються кожні 24 години без блокування основних HTTP-потоків.

### 🔒 5. Безпека рівня Enterprise (RBAC & Stateless Auth)
- **Role-Based Access Control (RBAC):** жорстке розділення рівнів доступу (`Менеджер` та `Касир`) через FastAPI Depends.
- **Хешування паролів:** автентифікація на базі `bcrypt` із криптографічною сіллю.
- **JWT-токени:** підписані алгоритмом `HS256` з фіксованим часом дії (TTL).

---

## 🛠 Технологічний стек

| Сфера | Стек | Призначення та переваги |
|---|---|---|
| **Backend Framework** | **FastAPI** (Python 3.13+) | Асинхронний високоефективний веб-фреймворк, підтримка OpenAPI / Swagger, Dependency Injection |
| **Data Validation** | **Pydantic v2** | Блискавична валідація схем і типізація на рівні C/Rust core |
| **Database Driver** | **asyncpg** | Низькорівневий асинхронний коннектор до PostgreSQL, максимальна пропускна здатність |
| **Database** | **PostgreSQL 15** | Повна підтримка ACID, тригери PL/pgSQL, представлення (Views), складні реляційні оператори |
| **Security & Auth** | **python-jose**, **bcrypt** | Хешування паролів, випуск та валідація безпечних JWT Bearer токенів |
| **Frontend** | **Vanilla JavaScript (ES6+)**, **HTML5**, **CSS3** | Модульна структура JS без важких фреймворків, висока швидкість завантаження |
| **UI Components** | **Bootstrap 5.3**, **Bootstrap Icons** | Адаптивний сучасний інтерфейс, стилізовані модальні форми та таблиці |
| **DevOps & Containers** | **Docker**, **Docker Compose** | Ізольоване контейнерне розгортання PostgreSQL та передбачуваність оточення |
| **Package Management** | **Pipenv** | Фіксація залежностей та детерміноване віртуальне середовище |

---

## 📐 Архітектура системи та бази даних

### Загальна архітектура системи

```mermaid
flowchart TD
    subgraph Client ["Клієнтський рівень (Frontend)"]
        UI_Cashier["🖥 POS-термінал (Касир)"]
        UI_Manager["📊 Панель управління (Менеджер)"]
    end

    subgraph Server ["Сервер додатків (FastAPI Backend)"]
        Router["Маршрутизатори API (REST Endpoints)"]
        AuthMiddleware["JWT & RBAC Security Layer"]
        ServiceLayer["Бізнес-логіка та Валідація (Pydantic v2)"]
        Worker["🕒 Фонова задача очищення чеків (>3 років)"]
        Pool["Пул асинхронних з'єднань (asyncpg Pool)"]
    end

    subgraph DB ["СУБД (PostgreSQL 15 Container)"]
        Tables[("Реляційні таблиці (3NF)")]
        Triggers["⚡ PL/pgSQL Тригер списання (sale -> store_product)"]
        Indexes["🔍 B-Tree Індекси"]
        Views["👁 Представлення view_store_inventory"]
    end

    UI_Cashier -->|"HTTP / REST API (Bearer JWT)"| Router
    UI_Manager -->|"HTTP / REST API (Bearer JWT)"| Router
    Router --> AuthMiddleware
    AuthMiddleware --> ServiceLayer
    ServiceLayer --> Pool
    Worker -.->|"Періодичний DELETE"| Pool
    Pool --> Tables
    Tables --> Triggers
    Tables --> Indexes
    Tables --> Views
```

---

### Реляційна модель даних (ER-діаграма)

База даних спроєктована в третій нормальній формі (3NF) з урахуванням усіх цілісних обмежень (FK, Check constraints, Unique indexes):

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : "групує"
    PRODUCT ||--o{ STORE_PRODUCT : "реалізується як"
    STORE_PRODUCT ||--o{ STORE_PRODUCT : "акційний аналог (upc_prom)"
    EMPLOYEE ||--o{ CHECK : "оформлює"
    CUSTOMER_CARD ||--o{ CHECK : "надає знижку"
    CHECK ||--|{ SALE : "містить позиції"
    STORE_PRODUCT ||--o{ SALE : "продається в"

    CATEGORY {
        serial category_number PK "Первинний ключ"
        varchar category_name UK "Унікальна назва (до 50 симв.)"
    }

    PRODUCT {
        serial id_product PK "ID товару"
        int category_number FK "Категорія товару"
        varchar product_name "Назва товару"
        varchar manufacturer "Виробник / Бренд"
        varchar characteristics "Опис та характеристики"
    }

    STORE_PRODUCT {
        varchar upc PK "Унікальний штрихкод (12 симв.)"
        varchar upc_prom FK "Посилання на акційний UPC"
        int id_product FK "ID товару в каталозі"
        decimal selling_price "Роздрібна ціна (>= 0)"
        int products_number "Кількість на складі (>= 0)"
        boolean promotional_product "Ознака акційного товару"
    }

    EMPLOYEE {
        varchar id_employee PK "Табельний номер"
        varchar password_hash "Хеш пароля (bcrypt)"
        varchar empl_surname "Прізвище"
        varchar empl_name "Ім'я"
        varchar empl_patronymic "По батькові"
        varchar empl_role "Посада (Менеджер / Касир)"
        decimal salary "Оклад (>= 0)"
        date date_of_birth "Дата народження (вік >= 18)"
        date date_of_start "Дата початку роботи"
        varchar phone_number "Номер телефону (до 13 симв.)"
        varchar city "Місто проживання"
        varchar street "Вулиця проживання"
        varchar zip_code "Поштовий індекс"
    }

    CUSTOMER_CARD {
        varchar card_number PK "Номер картки (13 симв.)"
        varchar cust_surname "Прізвище покупця"
        varchar cust_name "Ім'я покупця"
        varchar cust_patronymic "По батькові"
        varchar phone_number "Контактний телефон"
        varchar city "Місто"
        varchar street "Вулиця"
        varchar zip_code "Індекс"
        int percent "Відсоток дисконту (0-100%)"
    }

    CHECK {
        varchar check_number PK "Номер чека"
        varchar id_employee FK "Касир, що видав чек"
        varchar card_number FK "Застосована дисконтна картка"
        timestamp print_date "Дата та час друку"
        decimal sum_total "Загальна сума зі знижкою"
        decimal vat "ПДВ (20% від sum_total)"
    }

    SALE {
        varchar upc PK,FK "Штрихкод товару"
        varchar check_number PK,FK "Номер чека"
        int product_number "Кількість одиниць (> 0)"
        decimal selling_price "Ціна продажу одиниці"
    }
```

---

## 👥 Функціональні модулі

### 💳 1. Робоче місце касира (POS-термінал)
- **Оперативне сканування/введення:** миттєвий пошук позицій за штрихкодом UPC або назвою товару з виведенням залишку на складі.
- **Дисконтна система:** перевірка номера дисконтної картки та динамічний розрахунок знижки в режимі реального часу.
- **Автоматична фіскалізація:** розрахунок підсумкової суми чека, автоматичне виділення 20% ПДВ та списання залишків товару.
- **Формування фіскального чека:** повноцінне модальне вікно перегляду чека з підтримкою друку через принтер чеків (`window.print()`).
- **Контроль касової зміни:** перегляд історії власних чеків за сьогодні або за обраний період із підрахунком персонального виторгу.

### 📊 2. Панель керування менеджера (Back-Office)
- **Управління каталогом та асортиментом:** створення категорій, товарів, контроль характеристик та виробників.
- **Складський облік:** управління партіями в магазині (`store_product`), встановлення цін реалізації, зв'язування регулярних товарів з акційними (`upc_prom`).
- **Кадровий менеджмент:** повний цикл адміністрування співробітників (прийом на роботу, встановлення окладів, перевірка вікових обмежень $\ge 18$ років, звільнення).
- **Клієнтська база:** ведення карток постійних покупців, пошук за прізвищем, коригування відсотка лояльності.
- **Аналітика та Звіти:**
  - Звіт про загальну суму продажів за довільний інтервал часу.
  - Аналітика прибутковості за окремими категоріями товарів.
  - Звіт щодо проданої кількості конкретного товару (за UPC).
  - Спеціальний звіт: виявлення бестселерів (товарів, які продали **всі касири**).
  - Звіт ефективності: пошук касирів, які продали **всі товари обраного бренду**.

---

## 📁 Структура проєкту

```text
zlagoda_ais/
├── backend/
│   ├── api/                    # Модулі REST API ендпоінтів (FastAPI Routers)
│   │   ├── auth.py             # Авторизація OAuth2 (Password flow) та видача JWT
│   │   ├── categories.py       # CRUD операції для категорій товарів
│   │   ├── checks.py           # Оформлення чеків, продажі та аналітика виторгу
│   │   ├── customer_cards.py   # База карток клієнтів та відсотки знижок
│   │   ├── dep.py              # Ін'єкція залежностей: перевірка ролей та JWT
│   │   ├── employees.py        # Управління персоналом, зарплати, звіти ефективності
│   │   ├── products.py         # Номенклатурний довідник товарів, бестселери
│   │   └── store_product.py    # Складські запаси магазину (UPC, ціни, акції)
│   ├── core/                   # Системні компоненти ядра
│   │   ├── database.py         # Пул асинхронних з'єднань asyncpg
│   │   └── security.py         # Хешування паролів (bcrypt) та криптографія JWT
│   ├── database/               # Скрипти структури та міграцій
│   │   ├── init_db.py          # Створення DDL таблиць, тригерів, індексів та views
│   │   └── seed.py             # Автоматичне наповнення реалістичними тестовими даними
│   ├── schemas/                # Схеми валідації Pydantic v2 (DTO)
│   │   ├── category.py         # Моделі CategoryCreate, CategoryResponse
│   │   ├── check.py            # Схеми для створення чеків та розрахунку ПДВ
│   │   ├── customer_card.py    # Схеми дисконтних карток
│   │   ├── employee.py         # Схеми реєстрації та профілю працівника
│   │   ├── product.py          # Схеми каталогу товарів
│   │   └── store_product.py    # Схеми складських партій
│   └── main.py                 # Точка входу FastAPI: CORS, воркери, роутери
├── frontend/                   # Клієнтська частина веб-додатка
│   ├── static/
│   │   ├── css/style.css       # Кастомні стилі, оформлення POS-терміналу та чеків
│   │   └── js/                 # Модульний JavaScript (ES6 Modules)
│   │       ├── api.js          # HTTP-клієнт з автоматичною підстановкою JWT токена
│   │       ├── filters.js      # Логіка фільтрації списків та роботи з модальними вікнами
│   │       ├── main.js         # Загальні обробники таблиць та навігації
│   │       ├── pos.js          # Логіка POS-терміналу, кошик, знижки, друк чека
│   │       └── utils.js        # Форматування цін, дат та повідомлень
│   └── templates/              # HTML-сторінки інтерфейсу
│       ├── cashier/            # Робоче середовище касира (home, POS-термінал)
│       ├── manager/            # Робоче середовище менеджера (персонал, категорії, аналітика)
│       └── shared/             # Загальні сторінки (login, каталог товарів, чеки, клієнти)
├── .env.example                # Шаблон конфігурації змінних оточення
├── docker-compose.yml          # Специфікація контейнера PostgreSQL 15
├── Pipfile                     # Маніфест залежностей Pipenv
├── Pipfile.lock                # Зафіксовані версії бібліотек
└── README.md                   # Документація проєкту
```

---

## 🚀 Інструкція зі встановлення та запуску

### Попередні вимоги:
- **Python 3.13+**
- **Docker Desktop** (або встановлений локально PostgreSQL 15+)
- **Pipenv** (або стандартний `pip`)

---

### 1. Клонування репозиторію та конфігурація оточення

```bash
git clone https://github.com/Masoniu/zlagoda_ais.git
cd zlagoda_ais
```

Створіть власний файл `.env` на основі шаблону:

```powershell
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

Вміст `.env` за замовчуванням:
```env
DATABASE_URL=postgresql://zlagoda_user:1111@localhost:5433/zlagoda_db
SECRET_KEY=b9f8e7d6c5b4a392817263544536271809a8b7c6d5e4f3g2h1j0k9l8m7n6o5p4
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### 2. Запуск PostgreSQL у Docker

Підніміть контейнер із базою даних:

```bash
docker-compose up -d
```

Переконайтеся, що контейнер запущено успішно:
```bash
docker ps
```
> *Примітка: База даних транслює внутрішній порт `5432` на зовнішній порт хоста `5433`.*

---

### 3. Встановлення залежностей

#### Варіант А: Через `pipenv` (Рекомендовано)
```bash
# Встановлення pipenv (якщо не встановлено):
pip install pipenv

# Створення оточення та встановлення залежностей:
pipenv install --dev
```

#### Варіант Б: Через стандартний `pip`
```bash
pip install fastapi "uvicorn[standard]" asyncpg "python-jose[cryptography]" python-multipart "pydantic>=2.0.0" pydantic-settings bcrypt jinja2 pytest httpx
```

---

### 4. Ініціалізація та наповнення бази даних

Виконайте ініціалізацію схеми (таблиці, зв'язки, тригери, представлення, індекси):

```bash
# Через pipenv:
pipenv run python -m backend.database.init_db

# Або через звичайний python:
python -m backend.database.init_db
```

Запустіть сідинг для наповнення бази реалістичними тестовими даними (персонал, дисконтні картки, категорії, товари з штрихкодами, реалізовані чеки):

```bash
# Через pipenv:
pipenv run python -m backend.database.seed

# Або через звичайний python:
python -m backend.database.seed
```

---

### 5. Запуск серверної частини (FastAPI)

Запустіть асинхронний сервер додатків Uvicorn:

```bash
# Через pipenv:
pipenv run uvicorn backend.main:app --reload --port 8000

# Або через звичайний python:
uvicorn backend.main:app --reload --port 8000
```

Сервер стане доступним за адресою: **`http://localhost:8000`**

---

### 6. Запуск клієнтської частини (Frontend)

Фронтенд не вимагає важкої збірки (Node.js чи Webpack).
1. Відкрийте файл [`frontend/templates/shared/login.html`](frontend/templates/shared/login.html) у браузері.
2. Для комфортної розробки рекомендується запустити сторінку через розширення **Live Server** у VS Code або вбудований прев'ю-сервер у PyCharm / WebStorm.
3. Клієнт взаємодіє з бекендом за замовчуванням через адресу `http://localhost:8000`.

---

## 🔐 Тестові облікові записи

Система постачається з готовими акаунтами співробітників різного рангу. Пароль для всіх однаковий: **`123`**.

| Табельний номер (ID) | ПІБ Співробітника | Призначена роль | Посадові права | Пароль |
|:---:|:---|:---:|:---|:---:|
| **`1003009`** | Мельник Анна Олексіївна | `Менеджер` | Повний доступ, кадрові зміни, аналітика, видалення | `123` |
| **`13092007`** | Ткаченко Максим Петрович | `Менеджер` | Повний доступ до всіх модулів управління | `123` |
| **`1337`** | Коваленко Роман Сергійович | `Менеджер` | Повний доступ до всіх модулів управління | `123` |
| **`99001`** | Кравченко Віталій Миколайович | `Менеджер` | Повний доступ до всіх модулів управління | `123` |
| **`54321`** | Сидоренко Іван Петрович | `Касир` | POS-термінал, створення чеків, власна історія | `123` |
| **`11223`** | Коваль Марія Олегівна | `Касир` | POS-термінал, створення чеків, власна історія | `123` |
| **`33445`** | Петренко Олександр Сергійович | `Касир` | POS-термінал, створення чеків, власна історія | `123` |
| **`66778`** | Іванова Наталія Вікторівна | `Касир` | POS-термінал, створення чеків, власна історія | `123` |

---

## 📖 Документація API

FastAPI автоматично генерує інтерактивну документацію з можливістю тестування запитів та авторизації безпосередньо з веб-інтерфейсу:

- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Alternative:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Ключові групи ендпоінтів:

| Метод | Маршрут | Опис | Доступ |
|:---:|:---|:---|:---:|
| `POST` | `/auth/login` | Отримання JWT токена доступу (OAuth2 Password) | Всі |
| `GET` | `/employees/me` | Отримання профілю поточного авторизованого користувача | Авторизовані |
| `GET` | `/products/` | Отримання каталогу продукції з фільтрацією та сортуванням | Авторизовані |
| `POST` | `/products/` | Додавання нового найменування товару до каталогу | `Менеджер` |
| `PUT` | `/products/{id}` | Оновлення параметрів товару в каталозі | `Менеджер` |
| `DELETE` | `/products/{id}` | Видалення товару (за умови відсутності на залишках) | `Менеджер` |
| `GET` | `/products/reports/bestsellers` | Пошук бестселерів (реляційне ділення) | Авторизовані |
| `GET` | `/store-products/` | Список товарів у торговому залі (UPC, ціна, наявність, акції) | Авторизовані |
| `POST` | `/store-products/` | Постановка нової партії товару на облік за UPC | `Менеджер` |
| `GET` | `/customer-cards/` | Пошук та перегляд карток постійних покупців | Авторизовані |
| `POST` | `/customer-cards/` | Реєстрація нової дисконтної картки клієнта | `Менеджер` |
| `POST` | `/checks/` | Створення та закриття фіскального чека (з транзакцією) | `Касир` |
| `GET` | `/checks/` | Перегляд чеків (касир бачить власні, менеджер — всі) | Авторизовані |
| `GET` | `/checks/{number}/details` | Деталі чека: перелік куплених товарів, ціни, ПДВ | Авторизовані |
| `DELETE` | `/checks/{number}` | Анулювання чека (з опційним поверненням товару на полицю) | `Менеджер` |
| `GET` | `/checks/analytics/total-sum` | Сумарний виторг магазину або касира за обраний період | Авторизовані |
| `GET` | `/checks/reports/category-revenue` | Аналітичний звіт: виторг за товарними категоріями | `Менеджер` |
| `GET` | `/employees/reports/performance` | ТОП-5 касирів за обсягом продажів | `Менеджер` |
| `GET` | `/employees/reports/sold-all-brand` | Пошук касирів, що реалізували всі товари бренду | `Менеджер` |

---

## 🔒 Безпека та виробничі стандарти

1. **Захист від ін'єкцій:** Відмова від конкатенації рядків в SQL. Усі запити виконуються виключно через параметризовані аргументи драйвера `asyncpg`.
2. **Криптографічний захист:** Паролі користувачів зберігаються як bcrypt-хеші. Відновлення вихідного пароля з бази є неможливим.
3. **Обмеження життєвого циклу сесій:** JWT-токени мають регламентований TTL (Time-to-Live) та автоматично інвалідуються після закінчення терміну дії.
4. **Конфіденційність та ізоляція конфігурацій:** Файл конфігурації `.env` додано до `.gitignore`, що виключає випадковий витік секретних ключів у публічні репозиторії.
5. **CORS Policy:** У системі налаштовано гнучке керування політикою доступу з різних джерел (Cross-Origin Resource Sharing).

---

<div align="center">

**Розроблено як частина інженерного портфоліо сучасних інформаційних систем.**  
*Якщо цей проєкт був для вас корисним або цікавим, підтримайте репозиторій зірочкою ⭐️!*

[![GitHub](https://img.shields.io/badge/GitHub-Masoniu-181717?style=flat-square&logo=github)](https://github.com/Masoniu)
[![Repo](https://img.shields.io/badge/Repository-zlagoda__ais-blue?style=flat-square&logo=github)](https://github.com/Masoniu/zlagoda_ais)

</div>
