import asyncio
import asyncpg
import os
from datetime import date, datetime, timedelta
from dotenv import load_dotenv
from backend.core.security import get_password_hash #ВИДАЛИТИ ПОТІМ

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")


async def seed_data():
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        print("Очищення старих даних...")
        await conn.execute("""
            TRUNCATE category, employee, customer_card, product, 
                     store_product, "check", sale 
            RESTART IDENTITY CASCADE;
        """)

        print("Наповнення бази...")

        #категорії
        categories_data = [
            (1, "Молочні продукти"), (2, "М'ясні вироби"),
            (3, "Овочі та фрукти"), (4, "Напої"),
            (5, "Бакалія"), (6, "Кондитерські вироби"),
            (7, "Побутова хімія"), (8, "Хлібобулочні вироби"),
            (9, "Заморожені продукти"), (10, "Риба та морепродукти"),
            (11, "Соуси та приправи"), (12, "Дитячі товари"),
            (13, "Зоотовари"), (14, "Канцелярські товари"),
            (15, "Тютюнові вироби"), (16, "Алкогольні напої")
        ]
        await conn.executemany("""
                               INSERT INTO category (category_number, category_name)
                               VALUES ($1, $2)
                               """, categories_data)

        #працівники
        hash_123 = get_password_hash("123")
        employees_data = [
            ('12345', hash_123, 'Мельник', 'Анна', 'Олексіївна', 'Менеджер', 45000.00, date(1990, 5, 14),
             date(2023, 5, 20), '+380951234567', 'Київ', 'вул. Хрещатик 15', '02100'),
            ('1', hash_123, 'Ткаченко', 'Максим', 'Петрович', 'Менеджер', 45000.00, date(1988, 11, 22),
             date(2024, 2, 14), '+380957654321', 'Київ', 'вул. Володимирська 42', '02100'),
            ('2', hash_123, 'Коваленко', 'Роман', 'Сергійович', 'Менеджер', 45000.00, date(1993, 3, 18),
             date(2025, 3, 7), '+380689876543', 'Київ', 'вул. Велика Васильківська 28', '02100'),
            ('54321', hash_123, 'Сидоренко', 'Іван', 'Петрович', 'Касир', 18000.00, date(1995, 7, 22), date(2023, 3, 5),
             '+380671112233', 'Київ', 'Польова 12', '03056'),
            ('11223', hash_123, 'Коваль', 'Марія', 'Олегівна', 'Касир', 17500.00, date(1998, 11, 30), date(2023, 6, 15),
             '+380503334455', 'Київ', 'Харківське шосе 5', '02000'),
            ('33445', hash_123, 'Петренко', 'Олександр', 'Сергійович', 'Касир', 17000.00, date(2000, 4, 1),
             date(2024, 1, 10), '+380971234567', 'Львів', 'Шевченка 10', '79000'),
            ('66778', hash_123, 'Іванова', 'Наталія', 'Вікторівна', 'Касир', 18500.00, date(1992, 8, 15),
             date(2023, 9, 1), '+380669876543', 'Одеса', 'Дерибасівська 5', '65000'),
            ('99001', hash_123, 'Кравченко', 'Віталій', 'Миколайович', 'Менеджер', 46000.00, date(1985, 3, 20),
             date(2022, 11, 11), '+380675554433', 'Харків', 'Сумська 20', '61000'),
            ('10112', hash_123, 'Мороз', 'Ольга', 'Ігорівна', 'Касир', 17800.00, date(1999, 6, 25), date(2024, 3, 1),
             '+380501112233', 'Дніпро', 'Центральна 1', '49000'),
            ('13141', hash_123, 'Григоренко', 'Андрій', 'Васильович', 'Касир', 17200.00, date(1997, 1, 1),
             date(2023, 7, 7), '+380937778899', 'Запоріжжя', 'Соборний 15', '69000'),
            ('15161', hash_123, 'Лисенко', 'Тетяна', 'Сергіївна', 'Касир', 18000.00, date(2001, 10, 10),
             date(2024, 2, 20), '+380965556677', 'Полтава', 'Європейська 30', '36000'),
            ('17181', hash_123, 'Бондаренко', 'Сергій', 'Петрович', 'Менеджер', 47000.00, date(1980, 12, 5),
             date(2021, 10, 1), '+380671239876', 'Чернігів', 'Миру 45', '14000'),
            ('19202', hash_123, 'Шевченко', 'Ірина', 'Олександрівна', 'Касир', 17900.00, date(1996, 7, 7),
             date(2023, 4, 1), '+380504445566', 'Суми', 'Воскресенська 10', '40000')
        ]
        await conn.executemany("""
                               INSERT INTO employee (id_employee, password_hash, empl_surname, empl_name,
                                                     empl_patronymic,
                                                     empl_role, salary, date_of_birth, date_of_start, phone_number,
                                                     city, street, zip_code)
                               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                               """, employees_data)

        #список id_employee касирів для чеків
        cashier_ids = [e[0] for e in employees_data if e[5] == "Касир"]

        #клієнтські картки
        customers_data = [
            ('0000000000001', 'Коваленко', 'Олена', 'Іванівна', '+380671112233', 'Київ', 'Польова 12', '03056', 5),
            ('0000000000002', 'Іванов', 'Петро', 'Олегович', '+380509998877', 'Київ', 'Межигірська 10', '04071', 10),
            ('0000000000003', 'Мельник', 'Світлана', None, '+380630001122', 'Бориспіль', 'Київський шлях 2', '08301',
             3),
            ('0000000000004', 'Ткаченко', 'Андрій', 'Васильович', '+380981112233', 'Львів', 'Франка 5', '79005', 7),
            ('0000000000005', 'Савченко', 'Марина', 'Сергіївна', '+380675554433', 'Одеса', 'Пушкінська 15', '65010', 5),
            ('0000000000006', 'Литвиненко', 'Дмитро', 'Ігорович', '+380506667788', 'Харків', 'Наукова 3', '61001', 10),
            ('0000000000007', 'Поліщук', 'Надія', 'Петрівна', '+380931234567', 'Дніпро', 'Гагаріна 20', '49002', 3),
            ('0000000000008', 'Василенко', 'Віктор', 'Сергійович', '+380967778899', 'Запоріжжя', 'Перемоги 10',
             '69003', 7),
            ('0000000000009', 'Олійник', 'Ірина', 'Миколаївна', '+380681112233', 'Полтава', 'Соборності 50', '36004',
             5),
            ('0000000000010', 'Ковальчук', 'Олег', 'Володимирович', '+380952223344', 'Чернігів', 'Рокоссовського 1',
             '14005', 10),
            ('0000000000011', 'Бондар', 'Юлія', 'Анатоліївна', '+380633334455', 'Суми', 'Козацький Вал 7', '40006', 3),
            ('0000000000012', 'Гнатюк', 'Роман', 'Степанович', '+380974445566', 'Вінниця', 'Соборна 25', '21000', 7)
        ]
        await conn.executemany("""
                               INSERT INTO customer_card (card_number, cust_surname, cust_name, cust_patronymic,
                                                          phone_number, city, street, zip_code, percent)
                               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                               """, customers_data)

        #список card_number клієнтів для чеків
        customer_card_numbers = [c[0] for c in customers_data]

        #товари
        products_data = [
            (201, 1, "Йогурт питний", "Danone", "290г"), (202, 1, "Сир кисломолочний", "President", "9%"),
            (203, 2, "Ковбаса лікарська", "Алан", "вищий гатунок"), (204, 2, "Сосиски молочні", "Ятрань", ""),
            (205, 3, "Банани", "Еквадор", "стиглі"), (206, 3, "Картопля", "Україна", "відбірна"),
            (207, 4, "Вода Моршинська", "Моршинська", "0.5л, негазована"),
            (208, 4, "Сік апельсиновий", "Sandora", "1л"),
            (209, 5, "Рис пропарений", "Хуторок", "1кг"), (210, 5, "Макарони", "Barilla", "Penne"),
            (211, 6, "Торт Грильяжний", "БКК", "450г"), (212, 6, "Цукерки Ромашка", "Roshen", "200г"),
            (213, 7, "Порошок Tide", "Procter & Gamble", "Автомат, 3кг"), (214, 7, "Мило рідке", "Dove", "250мл"),
            (215, 8, "Батон Київський", "Київхліб", ""), (216, 8, "Круасан з шоколадом", "Власний цех", ""),
            (217, 1, "Молоко", "Простоквашино", "2.5%, 900мл"),
            (218, 2, "Шинка", "М'ясна гільдія", "нарізка"),
            (219, 3, "Яблука", "Україна", "Гала, 1кг"),
            (220, 4, "Кока-Кола", "Coca-Cola Company", "1.5л"),
            (221, 5, "Гречка", "Жменька", "800г"),
            (222, 6, "Шоколад чорний", "Світоч", "100г"),
            (223, 7, "Засіб для миття посуду", "Fairy", "500мл"),
            (224, 8, "Хліб пшеничний", "Київхліб", "Формовий"),
            (225, 9, "Морозиво", "Рудь", "пломбір, 400г"),
            (226, 10, "Філе хека", "Аквамарин", "Заморожене, 500г"),
            (227, 11, "Кетчуп", "Чумак", "томатний, 300г"),
            (228, 12, "Пюре фруктове", "Gerber", "яблуко, 125г"),
            (229, 13, "Корм для котів", "Whiskas", "курка, 400г"),
            (230, 14, "Зошит", "Школярик", "Шкільний, 48 аркушів"),
            (231, 1, "Кефір", "Яготинське", "1%, 900мл"),
            (232, 2, "Сардельки", "Глобино", "вищий гатунок"),
            (233, 3, "Помідори", "Україна", "Червоні, 1кг"),
            (234, 4, "Мінеральна вода", "Боржомі", "0.75л"),
            (235, 5, "Цукор", "Цукорок", "Пісок, 1кг"),
            (236, 6, "Печиво", "Roshen", "Марія, 200г"),
            (237, 7, "Пральний порошок", "Persil", "1.5кг"),
            (238, 8, "Булочка з маком", "Власний цех", "Свіжа випічка"),
            (239, 9, "Вареники з картоплею", "Легко", "1кг"),
            (240, 10, "Оселедець", "Рибний світ", "Солоний, 500г")
        ]
        await conn.executemany("""
                               INSERT INTO product (id_product, category_number, product_name, manufacturer,
                                                    characteristics)
                               VALUES ($1, $2, $3, $4, $5)
                               """, products_data)

        #товари в магазині (UPC)
        store_products_data = []
        upcs_for_sales = []
        upc_counter = 0

        for p_id, _, _, _, _ in products_data:
            upc_counter += 1
            upc_reg = f"{p_id:03d}{upc_counter:09d}"[:12]
            selling_price_reg = round(50.0 + p_id * 0.75, 2)
            store_products_data.append((upc_reg, None, p_id, selling_price_reg, 50, False))
            upcs_for_sales.append((upc_reg, selling_price_reg))

            #кожен третій товар робимо акційним
            if p_id % 3 == 0:
                upc_counter += 1
                upc_prom = f"{p_id:03d}P{upc_counter:08d}"[:12]
                selling_price_prom = round(selling_price_reg * 0.8, 2)
                store_products_data.append(
                    (upc_prom, upc_reg, p_id, selling_price_prom, 15, True))
                upcs_for_sales.append((upc_prom, selling_price_prom))

        await conn.executemany("""
                               INSERT INTO store_product (UPC, UPC_prom, id_product, selling_price, products_number,
                                                          promotional_product)
                               VALUES ($1, $2, $3, $4, $5, $6)
                               """, store_products_data)

        #чеки та продажі
        checks_to_insert = []
        sales_to_insert = []
        num_checks = 50

        cashier_idx = 0
        customer_idx = 0
        upc_sales_idx = 0
        base_date = datetime(2023, 10, 1, 9, 0, 0)

        for i in range(1, num_checks + 1):
            check_id = str(i)
            empl_id = cashier_ids[cashier_idx % len(cashier_ids)]
            cashier_idx += 1
            card_num = None
            if i % 3 != 0:
                card_num = customer_card_numbers[customer_idx % len(customer_card_numbers)]
                customer_idx += 1

            p_date = base_date + timedelta(hours=i * 2)
            check_sum = 0.0
            num_items_in_check = 3

            selected_upcs_for_sale = []
            for _ in range(num_items_in_check):
                selected_upcs_for_sale.append(upcs_for_sales[upc_sales_idx % len(upcs_for_sales)])
                upc_sales_idx += 1

            for upc_code, price in selected_upcs_for_sale:
                qty = 2
                sales_to_insert.append((upc_code, check_id, qty, price))
                check_sum += price * qty

            vat = round(check_sum * 0.2, 2)
            checks_to_insert.append((check_id, empl_id, card_num, p_date, round(check_sum, 2), vat))

        await conn.executemany("""
                               INSERT INTO "check" (check_number, id_employee, card_number, print_date, sum_total, vat)
                               VALUES ($1, $2, $3, $4, $5, $6)
                               """, checks_to_insert)

        await conn.executemany("""
                               INSERT INTO sale (UPC, check_number, product_number, selling_price)
                               VALUES ($1, $2, $3, $4)
                               """, sales_to_insert)

        await conn.execute("""
                           SELECT setval(pg_get_serial_sequence('category', 'category_number'),
                                         (SELECT MAX(category_number) FROM category));
                           SELECT setval(pg_get_serial_sequence('product', 'id_product'),
                                         (SELECT MAX(id_product) FROM product));
                           SELECT setval(pg_get_serial_sequence('check', 'check_number'),
                                         (SELECT MAX(CAST(check_number AS BIGINT)) FROM "check"))
                           """)

        await conn.execute("COMMIT")

        print(f"Базу даних наповнено. Додано {len(products_data)} товарів та {num_checks} чеків.")

    except Exception as e:
        print(f"Помилка: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_data())