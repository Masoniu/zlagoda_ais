import asyncio
from datetime import date, datetime, timedelta
import random
import os
import sys

# Налаштування шляхів для імпорту моделей
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.core.database import SessionLocal
from backend.models.employee import Employee
from backend.models.category import Category
from backend.models.product import Product
from backend.models.customer_card import CustomerCard
from backend.models.store_product import StoreProduct
from backend.models.check import Check
from backend.models.sale import Sale
from sqlalchemy import text


async def seed_data():
    async with SessionLocal() as session:
        try:
            print("🔄 Очищення старих даних та оновлення бази...")
            await session.execute(text("""
                TRUNCATE category, employee, customer_card, product, 
                         store_product, "check", sale 
                RESTART IDENTITY CASCADE;
            """))

            print("📦 Наповнення оновленими даними...")

            # 1. КАТЕГОРІЇ
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
            categories = [Category(category_number=id, category_name=name) for id, name in categories_data]
            session.add_all(categories)
            await session.flush()

            # 2. ПРАЦІВНИКИ
            hash_123 = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq"  # пароль "123"
            employees = [
                Employee(id_employee="12345", password_hash=hash_123, empl_surname="Мельник", empl_name="Анна",
                         empl_patronymic="Олексіївна", empl_role="Менеджер", salary=45000,
                         date_of_start=date(2023, 5, 20), date_of_birth=date(1990, 5, 14), phone_number="+380951234567",
                         city="Київ", street="вул. Хрещатик 15", zip_code="02100"),
                Employee(id_employee="1", password_hash=hash_123, empl_surname="Ткаченко", empl_name="Максим",
                         empl_patronymic="Петрович", empl_role="Менеджер", salary=45000,
                         date_of_start=date(2024, 2, 14), date_of_birth=date(1988, 11, 22), phone_number="+380957654321",
                         city="Київ", street="вул. Володимирська 42", zip_code="02100"),
                Employee(id_employee="2", password_hash=hash_123, empl_surname="Коваленко", empl_name="Роман",
                         empl_patronymic="Сергійович", empl_role="Менеджер", salary=45000,
                         date_of_start=date(2025, 3, 7), date_of_birth=date(1993, 3, 18), phone_number="+380689876543",
                         city="Київ", street="вул. Велика Васильківська 28", zip_code="02100"),
                Employee(id_employee="54321", password_hash=hash_123, empl_surname="Сидоренко", empl_name="Іван",
                         empl_patronymic="Петрович", empl_role="Касир", salary=18000, date_of_start=date(2023, 3, 5),
                         date_of_birth=date(1995, 7, 22), phone_number="+380671112233", city="Київ",
                         street="Польова 12", zip_code="03056"),
                Employee(id_employee="11223", password_hash=hash_123, empl_surname="Коваль", empl_name="Марія",
                         empl_patronymic="Олегівна", empl_role="Касир", salary=17500, date_of_start=date(2023, 6, 15),
                         date_of_birth=date(1998, 11, 30), phone_number="+380503334455", city="Київ",
                         street="Харківське шосе 5", zip_code="02000"),
                Employee(id_employee="33445", password_hash=hash_123, empl_surname="Петренко", empl_name="Олександр",
                         empl_patronymic="Сергійович", empl_role="Касир", salary=17000, date_of_start=date(2024, 1, 10),
                         date_of_birth=date(2000, 4, 1), phone_number="+380971234567", city="Львів",
                         street="Шевченка 10", zip_code="79000"),
                Employee(id_employee="66778", password_hash=hash_123, empl_surname="Іванова", empl_name="Наталія",
                         empl_patronymic="Вікторівна", empl_role="Касир", salary=18500, date_of_start=date(2023, 9, 1),
                         date_of_birth=date(1992, 8, 15), phone_number="+380669876543", city="Одеса",
                         street="Дерибасівська 5", zip_code="65000"),
                Employee(id_employee="99001", password_hash=hash_123, empl_surname="Кравченко", empl_name="Віталій",
                         empl_patronymic="Миколайович", empl_role="Менеджер", salary=46000,
                         date_of_start=date(2022, 11, 11), date_of_birth=date(1985, 3, 20), phone_number="+380675554433",
                         city="Харків", street="Сумська 20", zip_code="61000"),
                Employee(id_employee="10112", password_hash=hash_123, empl_surname="Мороз", empl_name="Ольга",
                         empl_patronymic="Ігорівна", empl_role="Касир", salary=17800, date_of_start=date(2024, 3, 1),
                         date_of_birth=date(1999, 6, 25), phone_number="+380501112233", city="Дніпро",
                         street="Центральна 1", zip_code="49000"),
                Employee(id_employee="13141", password_hash=hash_123, empl_surname="Григоренко", empl_name="Андрій",
                         empl_patronymic="Васильович", empl_role="Касир", salary=17200, date_of_start=date(2023, 7, 7),
                         date_of_birth=date(1997, 1, 1), phone_number="+380937778899", city="Запоріжжя",
                         street="Соборний 15", zip_code="69000"),
                Employee(id_employee="15161", password_hash=hash_123, empl_surname="Лисенко", empl_name="Тетяна",
                         empl_patronymic="Сергіївна", empl_role="Касир", salary=18000, date_of_start=date(2024, 2, 20),
                         date_of_birth=date(2001, 10, 10), phone_number="+380965556677", city="Полтава",
                         street="Європейська 30", zip_code="36000"),
                Employee(id_employee="17181", password_hash=hash_123, empl_surname="Бондаренко", empl_name="Сергій",
                         empl_patronymic="Петрович", empl_role="Менеджер", salary=47000,
                         date_of_start=date(2021, 10, 1), date_of_birth=date(1980, 12, 5), phone_number="+380671239876",
                         city="Чернігів", street="Миру 45", zip_code="14000"),
                Employee(id_employee="19202", password_hash=hash_123, empl_surname="Шевченко", empl_name="Ірина",
                         empl_patronymic="Олександрівна", empl_role="Касир", salary=17900, date_of_start=date(2023, 4, 1),
                         date_of_birth=date(1996, 7, 7), phone_number="+380504445566", city="Суми",
                         street="Воскресенська 10", zip_code="40000")
            ]
            session.add_all(employees)

            # 3. КЛІЄНТСЬКІ КАРТКИ
            customers = [
                CustomerCard(card_number="0000000000001", cust_surname="Коваленко", cust_name="Олена",
                             cust_patronymic="Іванівна", phone_number="+380671112233", city="Київ", street="Польова 12",
                             zip_code="03056", percent=5),
                CustomerCard(card_number="0000000000002", cust_surname="Іванов", cust_name="Петро",
                             cust_patronymic="Олегович", phone_number="+380509998877", city="Київ",
                             street="Межигірська 10", zip_code="04071", percent=10),
                CustomerCard(card_number="0000000000003", cust_surname="Мельник", cust_name="Світлана",
                             cust_patronymic=None, phone_number="+380630001122", city="Бориспіль",
                             street="Київський шлях 2", zip_code="08301", percent=3),
                CustomerCard(card_number="0000000000004", cust_surname="Ткаченко", cust_name="Андрій",
                             cust_patronymic="Васильович", phone_number="+380981112233", city="Львів",
                             street="Франка 5", zip_code="79005", percent=7),
                CustomerCard(card_number="0000000000005", cust_surname="Савченко", cust_name="Марина",
                             cust_patronymic="Сергіївна", phone_number="+380675554433", city="Одеса",
                             street="Пушкінська 15", zip_code="65010", percent=5),
                CustomerCard(card_number="0000000000006", cust_surname="Литвиненко", cust_name="Дмитро",
                             cust_patronymic="Ігорович", phone_number="+380506667788", city="Харків",
                             street="Наукова 3", zip_code="61001", percent=10),
                CustomerCard(card_number="0000000000007", cust_surname="Поліщук", cust_name="Надія",
                             cust_patronymic="Петрівна", phone_number="+380931234567", city="Дніпро",
                             street="Гагаріна 20", zip_code="49002", percent=3),
                CustomerCard(card_number="0000000000008", cust_surname="Василенко", cust_name="Віктор",
                             cust_patronymic="Сергійович", phone_number="+380967778899", city="Запоріжжя",
                             street="Перемоги 10", zip_code="69003", percent=7),
                CustomerCard(card_number="0000000000009", cust_surname="Олійник", cust_name="Ірина",
                             cust_patronymic="Миколаївна", phone_number="+380681112233", city="Полтава",
                             street="Соборності 50", zip_code="36004", percent=5),
                CustomerCard(card_number="0000000000010", cust_surname="Ковальчук", cust_name="Олег",
                             cust_patronymic="Володимирович", phone_number="+380952223344", city="Чернігів",
                             street="Рокоссовського 1", zip_code="14005", percent=10),
                CustomerCard(card_number="0000000000011", cust_surname="Бондар", cust_name="Юлія",
                             cust_patronymic="Анатоліївна", phone_number="+380633334455", city="Суми",
                             street="Козацький Вал 7", zip_code="40006", percent=3),
                CustomerCard(card_number="0000000000012", cust_surname="Гнатюк", cust_name="Роман",
                             cust_patronymic="Степанович", phone_number="+380974445566", city="Вінниця",
                             street="Соборна 25", zip_code="21000", percent=7)
            ]
            session.add_all(customers)
            await session.flush()

            # 4. ТОВАРИ (Довідник)
            products_list = [
                (201, 1, "Йогурт питний", "Danone, 290г"), (202, 1, "Сир кисломолочний", "President, 9%"),
                (203, 2, "Ковбаса лікарська", "Алан, вищий гатунок"), (204, 2, "Сосиски молочні", "Ятрань"),
                (205, 3, "Банани", "Еквадор, стиглі"), (206, 3, "Картопля", "Україна, відбірна"),
                (207, 4, "Вода Моршинська", "0.5л, негазована"), (208, 4, "Сік апельсиновий", "Sandora, 1л"),
                (209, 5, "Рис пропарений", "Хуторок, 1кг"), (210, 5, "Макарони", "Barilla Penne"),
                (211, 6, "Торт Грильяжний", "БКК, 450г"), (212, 6, "Цукерки Ромашка", "Roshen, 200г"),
                (213, 7, "Порошок Tide", "Автомат, 3кг"), (214, 7, "Мило рідке", "Dove, 250мл"),
                (215, 8, "Батон Київський", "Київхліб"), (216, 8, "Круасан з шоколадом", "Власний цех"),
                (217, 1, "Молоко", "Простоквашино, 2.5%, 900мл"),
                (218, 2, "Шинка", "М'ясна гільдія, нарізка"),
                (219, 3, "Яблука", "Гала, 1кг"),
                (220, 4, "Кока-Кола", "1.5л"),
                (221, 5, "Гречка", "Жменька, 800г"),
                (222, 6, "Шоколад чорний", "Світоч, 100г"),
                (223, 7, "Засіб для миття посуду", "Fairy, 500мл"),
                (224, 8, "Хліб пшеничний", "Формовий"),
                (225, 9, "Морозиво", "Рудь, пломбір, 400г"),
                (226, 10, "Філе хека", "Заморожене, 500г"),
                (227, 11, "Кетчуп", "Чумак, томатний, 300г"),
                (228, 12, "Пюре фруктове", "Gerber, яблуко, 125г"),
                (229, 13, "Корм для котів", "Whiskas, курка, 400г"),
                (230, 14, "Зошит", "Шкільний, 48 аркушів"),
                (231, 1, "Кефір", "Яготинське, 1%, 900мл"),
                (232, 2, "Сардельки", "Глобино, вищий гатунок"),
                (233, 3, "Помідори", "Червоні, 1кг"),
                (234, 4, "Мінеральна вода", "Боржомі, 0.75л"),
                (235, 5, "Цукор", "Пісок, 1кг"),
                (236, 6, "Печиво", "Марія, 200г"),
                (237, 7, "Пральний порошок", "Persil, 1.5кг"),
                (238, 8, "Булочка з маком", "Свіжа випічка"),
                (239, 9, "Вареники з картоплею", "Легко, 1кг"),
                (240, 10, "Оселедець", "Солоний, 500г")
            ]
            products = [Product(id_product=id, category_number=cat, product_name=name, characteristics=chars) for
                        id, cat, name, chars in products_list]
            session.add_all(products)
            await session.flush()

            # 5. ТОВАРИ В МАГАЗИНІ (UPC)
            upcs = []
            for p in products:
                # Додаємо звичайний товар
                upc_reg = f"{p.id_product:03d}000000000"[:12] # Ensure UPC is 12 chars, pad with zeros
                sp_reg = StoreProduct(UPC=upc_reg, id_product=p.id_product, selling_price=random.uniform(20, 300),
                                      products_number=random.randint(20, 100), promotional_product=False)
                session.add(sp_reg)
                upcs.append((upc_reg, sp_reg.selling_price))

                # Кожен третій товар робимо акційним
                if p.id_product % 3 == 0:
                    upc_prom = f"{p.id_product:03d}777777777"[:12] # Ensure UPC is 12 chars, pad with zeros
                    sp_prom = StoreProduct(UPC=upc_prom, UPC_prom=upc_reg, id_product=p.id_product,
                                           selling_price=sp_reg.selling_price * 0.8,
                                           products_number=random.randint(5, 30), promotional_product=True)
                    session.add(sp_prom)
                    upcs.append((upc_prom, sp_prom.selling_price))

            await session.flush()

            # 6. ЧЕКИ ТА ПРОДАЖІ (Створюємо історію за останні 30 днів)
            for i in range(1, 50): # Збільшено кількість чеків
                check_id = str(i)
                empl = random.choice([e for e in employees if e.empl_role == "Касир"])  # тільки касири
                cust = random.choice(customers + [None])  # може бути без карти
                p_date = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))

                # Створюємо продажі для цього чека
                check_sum = 0
                num_items = random.randint(1, 7) # Збільшено кількість товарів у чеку
                selected_upcs = random.sample(upcs, min(num_items, len(upcs))) # Запобігаємо помилці, якщо товарів менше

                for upc_code, price in selected_upcs:
                    qty = random.randint(1, 5) # Збільшено кількість одиниць товару
                    session.add(Sale(UPC=upc_code, check_number=check_id, product_number=qty, selling_price=price))
                    check_sum += price * qty

                vat = check_sum * 0.2
                session.add(Check(check_number=check_id, id_employee=empl.id_employee,
                                  card_number=cust.card_number if cust else None, print_date=p_date,
                                  sum_total=check_sum, vat=vat))

            await session.commit()
            print(f"✅ База успішно ожила! Додано {len(products_list)} товарів та {i} чеків.")

        except Exception as e:
            await session.rollback()
            print(f"❌ Помилка при заповненні: {e}")
            raise # Re-raise the exception for better debugging


if __name__ == "__main__":
    asyncio.run(seed_data())