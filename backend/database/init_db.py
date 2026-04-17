import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


async def init_db():
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        print("Створення таблиць через SQL...")
        async with conn.transaction():
            # категорія
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS category (
                    category_number SERIAL PRIMARY KEY,
                    category_name VARCHAR(50) NOT NULL
                );
            """)

            # працівник
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS employee (
                    id_employee VARCHAR(10) PRIMARY KEY,
                    password_hash VARCHAR(255) NOT NULL,
                    empl_surname VARCHAR(50) NOT NULL,
                    empl_name VARCHAR(50) NOT NULL,
                    empl_patronymic VARCHAR(50),
                    empl_role VARCHAR(10) NOT NULL,
                    salary DECIMAL(13, 4) NOT NULL CHECK (salary >= 0),
                    date_of_birth DATE NOT NULL,
                    date_of_start DATE NOT NULL,
                    phone_number VARCHAR(13) NOT NULL CHECK (LENGTH(phone_number) <= 13),
                    city VARCHAR(50) NOT NULL,
                    street VARCHAR(50) NOT NULL,
                    zip_code VARCHAR(9) NOT NULL,
                    CONSTRAINT check_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'
                                               )
                );
            """)

            # карта клієнта
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS customer_card (
                    card_number VARCHAR(13) PRIMARY KEY,
                    cust_surname VARCHAR(50) NOT NULL,
                    cust_name VARCHAR(50) NOT NULL,
                    cust_patronymic VARCHAR(50),
                    phone_number VARCHAR(13) NOT NULL CHECK (LENGTH(phone_number) <= 13),
                    city VARCHAR(50),
                    street VARCHAR(50),
                    zip_code VARCHAR(9),
                    percent INT NOT NULL CHECK (percent >= 0 AND percent <= 100
                                               )
                );
            """)

            # товар
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id_product SERIAL PRIMARY KEY,
                    category_number INT NOT NULL REFERENCES category(category_number) ON DELETE NO ACTION ON UPDATE CASCADE,
                    product_name VARCHAR(50) NOT NULL,
                    manufacturer VARCHAR(50) NOT NULL,
                    characteristics VARCHAR(100) NOT NULL
                );
            """)

            # товар у магазині
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS store_product (
                    UPC VARCHAR(12) PRIMARY KEY,
                    UPC_prom VARCHAR(12) REFERENCES store_product(UPC) ON DELETE SET NULL ON UPDATE CASCADE,
                    id_product INT NOT NULL REFERENCES product(id_product) ON DELETE NO ACTION ON UPDATE CASCADE,
                    selling_price DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
                    products_number INT NOT NULL CHECK (products_number >= 0),
                    promotional_product BOOLEAN NOT NULL
                );
            """)

            # чек
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "check" (
                    check_number VARCHAR(10) PRIMARY KEY,
                    id_employee VARCHAR(10) NOT NULL REFERENCES employee(id_employee) ON DELETE NO ACTION ON UPDATE CASCADE,
                    card_number VARCHAR(13) REFERENCES customer_card(card_number) ON DELETE NO ACTION ON UPDATE CASCADE,
                    print_date TIMESTAMP NOT NULL,
                    sum_total DECIMAL(13, 4) NOT NULL CHECK (sum_total >= 0),
                    vat DECIMAL(13, 4) NOT NULL CHECK (vat >= 0
                                                      )
                );
            """)

            # sale
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sale (
                    UPC VARCHAR(12) NOT NULL REFERENCES store_product(UPC) ON DELETE NO ACTION ON UPDATE CASCADE,
                    check_number VARCHAR(10) NOT NULL REFERENCES "check"(check_number) ON DELETE CASCADE ON UPDATE CASCADE,
                    product_number INT NOT NULL CHECK (product_number > 0),
                    selling_price DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
                    PRIMARY KEY (UPC, check_number
                                )
                );
            """)

        print("Базу даних ініціалізовано")

    except Exception as e:
        print(f"Помилка ініціалізації: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_db())