/*
АІС ZLAGODA - Головний файл логіки (Frontend)
Підключено до FastAPI (http://127.0.0.1:8000)
*/

// ==========================================
// 1. ГЛОБАЛЬНІ ЗМІННІ ТА ДАНІ
// ==========================================
let itemToDeleteId = null;
let itemToDeleteType = null;
let currentSortColumn = '';
let isAscending = true;
let currentReceipt = [];
let appliedCustomer = null;

let mockCategories = [];
let mockProducts = [];
let mockStoreProducts = [];
let mockEmployees = [];
let mockCustomers = [];
let mockChecks = [];
let mockSales = [];

// Зберігаємо стан фільтрів для модального вікна
let savedFilters = {
    'employees': { manager: true, cashier: true },
    'customers': { percent: 0 },
    'products': { categories: null }, // null = всі вибрані за замовчуванням
    'store-products': { promo: 'all' },
    'checks': { cashier: 'all', start: '', end: '' }
};

const API_BASE_URL = 'http://127.0.0.1:8000';

// ==========================================
// 2. ФУНКЦІЇ ЗВ'ЯЗКУ З БЕКЕНДОМ (API ADAPTERS)
// ==========================================
async function apiFetch(endpoint) {
    const token = sessionStorage.getItem('token');
    if (!token) return [];

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = '../shared/login.html';
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Помилка API:", error);
        return [];
    }
}

async function apiMutate(endpoint, method, data = null) {
    const token = sessionStorage.getItem('token');
    const options = {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }
    };

    if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = '../shared/login.html';
            return { success: false };
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Помилка сервера');
        }

        if (method === 'DELETE' || response.status === 204) {
            return { success: true };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error(`Помилка ${method} ${endpoint}:`, error);
        showBeautifulAlert(error.message, 'danger');
        return { success: false, error: error.message };
    }
}

async function loadRealDataFromDB() {
    // Перевіряємо, чи ми зараз на сторінці каси (POS)
    const isPosPage = document.getElementById('posScanForm') !== null;

    // 1. Категорії
    if (document.getElementById('categoryTableBody') || document.getElementById('productTableBody')) {
        mockCategories = await apiFetch('/categories/');
        if (document.getElementById('categoryTableBody')) {
            renderCategories(mockCategories);
            setupSearch('categorySearch', mockCategories, renderCategories, 'category_name');
        }
    }
    // 2. Товари (каталог)
    if (document.getElementById('productTableBody') || document.getElementById('storeProductTableBody') || isPosPage) {
        const dbProducts = await apiFetch('/products/');
        mockProducts = dbProducts.map(p => ({
            id: p.id_product, name: p.product_name, manufacturer: p.manufacturer,
            chars: p.characteristics, category_id: p.category_number
        }));
        if (document.getElementById('productTableBody')) {
            renderProducts(mockProducts);
            populateCategoryDropdown();
            setupSearch('productSearch', mockProducts, renderProducts, 'name');
        }
    }
    // 3. Товари в магазині (партії)
    if (document.getElementById('storeProductTableBody') || isPosPage) {
        const dbStoreProducts = await apiFetch('/store-products/');
        mockStoreProducts = dbStoreProducts.map(sp => ({
            upc: sp.upc || sp.UPC,
            id_product: sp.id_product, selling_price: parseFloat(sp.selling_price),
            products_number: sp.products_number, promotional_product: sp.promotional_product
        }));
        if (document.getElementById('storeProductTableBody')) {
            renderStoreProducts(mockStoreProducts);
            populateProductDropdown();
            setupSearch('storeProductSearch', mockStoreProducts, renderStoreProducts, 'upc');
        }
    }
    // 4. Клієнти
    if (document.getElementById('customerTableBody') || isPosPage) {
        const dbCustomers = await apiFetch('/customer-cards/');
        mockCustomers = dbCustomers.map(c => ({
            card_number: c.card_number, surname: c.cust_surname, name: c.cust_name, patronymic: c.cust_patronymic,
            phone: c.phone_number, city: c.city, street: c.street, zip: c.zip_code, percent: c.percent
        }));
        if (document.getElementById('customerTableBody')) {
            renderCustomers(mockCustomers);
            setupSearch('customerSearch', mockCustomers, renderCustomers, 'surname');
        }
    }
    // 5. Працівники
    if (document.getElementById('employeeTableBody') || document.getElementById('checkTableBody')) {
        let dbEmployees = [];
        // Касир не має права бачити всіх, тому вантажимо лише його профіль
        if (sessionStorage.getItem('userRole') === 'Менеджер') {
            dbEmployees = await apiFetch('/employees/');
        } else {
            const me = await apiFetch('/employees/me');
            if (me && me.id_employee) dbEmployees = [me];
        }
        // Перевіряємо, чи отримали масив, щоб уникнути помилок
        if (Array.isArray(dbEmployees)) {
            mockEmployees = dbEmployees.map(e => ({
                id: e.id_employee, surname: e.empl_surname, name: e.empl_name, patronymic: e.empl_patronymic,
                role: e.empl_role, salary: e.salary, start_date: e.date_of_start, birth_date: e.date_of_birth,
                phone: e.phone_number, city: e.city, street: e.street, zip: e.zip_code
            }));
            if (document.getElementById('employeeTableBody')) {
                renderEmployees(mockEmployees);
                setupSearch('employeeSearch', mockEmployees, renderEmployees, 'surname');
            }
        }
    }
    // 6. Чеки
    if (document.getElementById('checkTableBody')) {
        const dbChecks = await apiFetch('/checks/');
        mockChecks = dbChecks.map(c => ({
            check_number: c.check_number, id_employee: c.id_employee, card_number: c.card_number,
            print_date: new Date(c.print_date).toLocaleString('uk-UA'), sum_total: parseFloat(c.sum_total), vat: parseFloat(c.vat)
        }));
        renderChecks(mockChecks);
        setupSearch('checkSearch', mockChecks, renderChecks, 'check_number');
    }

    populatePosDatalists();
}

// ==========================================
// 3. ФУНКЦІЇ РЕНДЕРУ (МАЛЮВАННЯ ТАБЛИЦЬ)
// ==========================================
function renderCategories(data) {
    const tableBody = document.getElementById('categoryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = data.map(cat => `
        <tr>
            <td class="ps-4 text-muted">#${cat.category_number}</td>
            <td class="fw-semibold">${cat.category_name}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn_edit me-2">Редагувати</button>
                <button class="btn btn-sm btn_delete">Видалити</button>
            </td>
        </tr>`).join('');
}

function renderProducts(data) {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = data.map(prod => {
        const category = mockCategories.find(c => c.category_number === prod.category_id);
        const catName = category ? category.category_name : "Невідомо";
        return `
            <tr>
                <td class="ps-4 text-muted">#${prod.id}</td>
                <td class="fw-semibold">${prod.name}</td>
                <td class="text-muted">${prod.manufacturer}</td>
                <td class="text-muted small">${prod.chars}</td>
                <td><span class="badge bg-light text-dark border p-2 fs-6 fw-normal">${catName}</span></td>
                <td class="text-end pe-4 cashier-hide-col">
                    <button class="btn btn-sm btn_edit me-2">Редагувати</button>
                    <button class="btn btn-sm btn_delete">Видалити</button>
                </td>
            </tr>`;
    }).join('');
}

function renderStoreProducts(data) {
    const tableBody = document.getElementById('storeProductTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = data.map(sp => {
        const productInfo = mockProducts.find(p => p.id === sp.id_product);
        const productName = productInfo ? productInfo.name : "Невідомий товар";
        const promoBadge = sp.promotional_product
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success p-2 fs-6">Так</span>'
            : '<span class="badge bg-light text-muted fw-normal p-2 fs-6">Ні</span>';
        return `
            <tr>
                <td class="ps-4 text-muted small">#${sp.upc}</td>
                <td class="fw-semibold">${productName}</td>
                <td>${sp.selling_price.toFixed(2)}</td>
                <td>${sp.products_number} шт.</td>
                <td>${promoBadge}</td>
                <td class="text-end pe-4 cashier-hide-col">
                    <button class="btn btn-sm btn_edit me-2" onclick="prepareEditStoreProduct('${sp.upc}')">Редагувати</button>
                    <button class="btn btn-sm btn_delete" onclick="deleteStoreProduct('${sp.upc}')">Видалити</button>
                </td>
            </tr>`;
    }).join('');
}

function renderChecks(data) {
    const tableBody = document.getElementById('checkTableBody');
    if (!tableBody) return;
    const totalSum = data.reduce((sum, chk) => sum + chk.sum_total, 0);
    const sumElement = document.getElementById('totalChecksSum');
    if (sumElement) sumElement.textContent = totalSum.toFixed(2);

    tableBody.innerHTML = data.map(chk => {
        const empl = mockEmployees.find(e => e.id === chk.id_employee);
        const cashierName = empl ? `${empl.surname} ${empl.name[0]}.` : "Невідомий";
        return `
            <tr>
                <td class="ps-4">#${chk.check_number}</td>
                <td class="fw-semibold">${cashierName}</td>
                <td class="text-muted small">${chk.print_date}</td>
                <td>${chk.sum_total.toFixed(2)}</td>
                <td class="text-muted">${chk.vat.toFixed(2)}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm p-1 me-2" onclick="viewCheckDetails('${chk.check_number}')" title="Деталі чека">
                        <i class="bi bi-receipt icon-zlagoda fs-5"></i>
                    </button>
                    <button class="btn btn-sm btn_delete" onclick="deleteCheck('${chk.check_number}')">Видалити</button>
                </td>
            </tr>`;
    }).join('');
}

function renderEmployees(data) {
    const tableBody = document.getElementById('employeeTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = data.map(empl => `
        <tr>
            <td class="ps-4 text-muted small">#${empl.id}</td>
            <td class="fw-semibold">${empl.surname} ${empl.name[0]}. ${empl.patronymic ? empl.patronymic[0] + '.' : ''}</td>
            <td><span class="badge-empl ${empl.role === 'Менеджер' ? 'badge-manager' : 'badge-cashier'}">${empl.role}</span></td>
            <td class="text-muted">${empl.phone}</td>
            <td>${empl.salary} грн</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm p-1 me-2" onclick="viewEmployeeDetails('${empl.id}')" title="Детальна інформація">
                    <i class="bi bi-info-circle icon-zlagoda fs-5"></i>
                </button>
                <button class="btn btn-sm btn_edit me-2" onclick="prepareEditEmployee('${empl.id}')">Редагувати</button>
                <button class="btn btn-sm btn_delete" onclick="deleteEmployee('${empl.id}')">Видалити</button>
            </td>
        </tr>`).join('');
}

function renderCustomers(data) {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = data.map(cust => `
        <tr>
            <td class="ps-4 text-muted small">#${cust.card_number}</td>
            <td class="fw-semibold">${cust.surname} ${cust.name[0]}. ${cust.patronymic ? cust.patronymic[0] + '.' : ''}</td>
            <td class="text-muted">${cust.phone}</td>
            <td><span class="badge bg-success bg-opacity-10 text-success border border-success p-2 fs-6">${cust.percent}%</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm p-1 me-2" onclick="viewCustomerDetails('${cust.card_number}')" title="Детальна інформація">
                    <i class="bi bi-info-circle icon-zlagoda fs-5"></i>
                </button>
                <button class="btn btn-sm btn_edit me-2" onclick="prepareEditCustomer('${cust.card_number}')">Редагувати</button>
                <button class="btn btn-sm btn_delete" onclick="deleteCustomer('${cust.card_number}')">Видалити</button>
            </td>
        </tr>`).join('');
}

function renderPosTable() {
    const tbody = document.getElementById('posTableBody');
    if (!tbody) return;

    if (currentReceipt.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-5">Чек порожній. Відскануйте товар.</td></tr>';
        return;
    }

    tbody.innerHTML = currentReceipt.map((item, index) => `
        <tr>
            <td class="ps-4">
                <div class="fw-bold">${item.name}</div>
                <div class="text-muted small">UPC: ${item.upc}</div>
            </td>
            <td>${item.price.toFixed(2)}</td>
            <td class="text-center">
                <div class="d-flex border rounded-2 mx-auto" style="border-color: var(--text-color) !important; width: fit-content; overflow: hidden;">
                    <button type="button" class="btn btn-sm btn-qty-pos border-0 rounded-0 px-2" onclick="changeQty(${index}, -1)">-</button>
                    <div class="border-start border-end d-flex align-items-center justify-content-center fw-bold bg-white"
                         style="width: 40px; border-color: var(--text-color) !important; color: var(--text-color);">
                        ${item.quantity}
                    </div>
                    <button type="button" class="btn btn-sm btn-qty-pos border-0 rounded-0 px-2" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </td>
            <td class="fw-bold">${(item.price * item.quantity).toFixed(2)}</td>
            <td class="text-end pe-4">
                <button type="button" class="btn btn-delete-pos p-0 fs-5" onclick="removeFromReceipt(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 4. ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ РЕНДЕРУ
// ==========================================
function populatePosDatalists() {
    const upcList = document.getElementById('posUpcList');
    if (upcList) {
        upcList.innerHTML = '';
        mockStoreProducts.forEach(sp => {
            const prod = mockProducts.find(p => p.id === sp.id_product);
            const name = prod ? prod.name : 'Невідомий товар';
            upcList.innerHTML += `<option value="${sp.upc}">${name} (Ціна: ${sp.selling_price} грн, Залишок: ${sp.products_number} шт)</option>`;
        });
    }
    const cardList = document.getElementById('posCardList');
    if (cardList) {
        cardList.innerHTML = '';
        mockCustomers.forEach(c => {
            cardList.innerHTML += `<option value="${c.card_number}">${c.surname} ${c.name[0]}. (Знижка: ${c.percent}%, Тел: ${c.phone})</option>`;
        });
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('categorySelectInput');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>Оберіть категорію...</option>';
    mockCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.category_number}">${cat.category_name}</option>`;
    });
}

function populateProductDropdown() {
    const select = document.getElementById('spProductSelect');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>Оберіть товар з довідника...</option>';
    mockProducts.forEach(prod => {
        select.innerHTML += `<option value="${prod.id}">${prod.name} (${prod.manufacturer || 'Без виробника'})</option>`;
    });
}

function displayUserName() {
    const display = document.getElementById('userNameDisplay');
    if (display) display.textContent = sessionStorage.getItem('userName') || "Користувач";
}

function updateGreeting() {
    const el = document.getElementById('dynamicGreeting');
    if (!el) return;
    const hour = new Date().getHours();
    const name = sessionStorage.getItem('userName') || "колего";
    let text = hour < 12 ? "Доброго ранку" : hour < 17 ? "Доброго дня" : hour < 21 ? "Доброго вечора" : "Доброї ночі";
    el.textContent = `${text}, ${name}!`;
}

function setupSearch(inputId, data, renderFn, field) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = data.filter(item => {
            const fieldValue = item[field] ? item[field].toString().toLowerCase() : '';
            return fieldValue.includes(value);
        });
        renderFn(filtered);
    });
}

// ==========================================
// 5. ЛОГІКА АВТОРИЗАЦІЇ (LOGIN)
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const enteredID = document.getElementById('loginInput').value.trim();
        const enteredPass = document.getElementById('passwordInput').value.trim();
        const alertMessage = document.getElementById('alertMessage');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        alertMessage.textContent = '';
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            const formData = new URLSearchParams();
            formData.append('username', enteredID);
            formData.append('password', enteredPass);

            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!loginResponse.ok) throw new Error('Невірний логін або пароль');

            const tokenData = await loginResponse.json();
            const token = tokenData.access_token;
            sessionStorage.setItem('token', token);

            const meResponse = await fetch(`${API_BASE_URL}/employees/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!meResponse.ok) throw new Error('Помилка завантаження профілю');

            const meData = await meResponse.json();
            const initials = `${meData.empl_surname} ${meData.empl_name[0]}. ${meData.empl_patronymic ? meData.empl_patronymic[0] + '.' : ''}`.trim();

            sessionStorage.setItem('userName', initials);
            sessionStorage.setItem('userRole', meData.empl_role);
            sessionStorage.setItem('userId', meData.id_employee);

            alertMessage.style.color = 'var(--primary-color)';
            alertMessage.textContent = `Вітаємо, ${initials}!`;
            setTimeout(() => {
                if (meData.empl_role === 'Менеджер') {
                    window.location.href = '../manager/home.html';
                } else {
                    window.location.href = '../cashier/home.html';
                }
            }, 500);

        } catch (error) {
            alertMessage.style.color = 'red';
            alertMessage.textContent = error.message;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// ==========================================
// 6. ГОЛОВНИЙ ЖИТТЄВИЙ ЦИКЛ (ОНОВЛЕННЯ СТОРІНКИ)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Якщо це сторінка логіну - не виконуємо решту скрипта
    if (document.querySelector('.login_page')) {
        document.body.classList.add('loaded');
        return;
    }

    const role = sessionStorage.getItem('userRole');
    if (role === 'Касир') {
        document.body.classList.add('cashier-mode');
    }

    // Завантаження компонентів (Навбар та Модалки)
    const modalsPlaceholder = document.getElementById('modals_placeholder');
    if (modalsPlaceholder) {
        try {
            const res = await fetch('../shared/modals.html');
            modalsPlaceholder.innerHTML = await res.text();
        } catch (error) { console.error("Помилка завантаження модалок:", error); }
    }

    const navPlaceholder = document.getElementById('navbar_placeholder');
    if (navPlaceholder) {
        const navFile = (role === 'Касир') ? '../shared/cash_navbar.html' : '../shared/man_navbar.html';
        try {
            const res = await fetch(navFile);
            navPlaceholder.innerHTML = await res.text();

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    bootstrap.Modal.getOrCreateInstance(document.getElementById('logoutModal')).show();
                });
            }
            displayUserName();
        } catch (error) { console.error("Помилка завантаження меню:", error); }
    }

    updateGreeting();

    // Завантаження реальних даних
    await loadRealDataFromDB();

    // Ініціалізація форм
    setupCategoryForm();
    setupProductForm();
    setupStoreProductForm();
    setupEmployeeForm();
    setupCustomerForm();

    // Вихід з акаунту
    const confirmLogout = document.getElementById('confirmLogout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '../shared/login.html';
        });
    }

    // Універсальне видалення
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) {
        btnConfirmDelete.onclick = async () => {
            const modalEl = document.getElementById('deleteConfirmModal');
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            let endpoint = '';

            if (itemToDeleteType === 'category') endpoint = `/categories/${itemToDeleteId}`;
            else if (itemToDeleteType === 'product') endpoint = `/products/${itemToDeleteId}`;
            else if (itemToDeleteType === 'employee') endpoint = `/employees/${itemToDeleteId}`;
            else if (itemToDeleteType === 'customer') endpoint = `/customer-cards/${itemToDeleteId}`;
            else if (itemToDeleteType === 'store_product') endpoint = `/store-products/${itemToDeleteId}`;
            else if (itemToDeleteType === 'check') endpoint = `/checks/${itemToDeleteId}`;

            if (endpoint) {
                const originalText = btnConfirmDelete.innerHTML;
                btnConfirmDelete.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Видалення...';
                btnConfirmDelete.disabled = true;

                const res = await apiMutate(endpoint, 'DELETE');

                btnConfirmDelete.innerHTML = originalText;
                btnConfirmDelete.disabled = false;

                if (res.success) {
                    modalInstance.hide();
                    await loadRealDataFromDB();
                }
            }
        };
    }

    // Делегування подій для таблиць (Кліки на Редагувати/Видалити)
    const tables = [
        { id: 'categoryTableBody', deleteFn: deleteCategory, editFn: prepareEditCategory },
        { id: 'productTableBody', deleteFn: deleteProduct, editFn: prepareEditProduct },
        { id: 'employeeTableBody', deleteFn: deleteEmployee, editFn: prepareEditEmployee },
        { id: 'customerTableBody', deleteFn: deleteCustomer, editFn: prepareEditCustomer }
    ];

    tables.forEach(tableInfo => {
        const tableElement = document.getElementById(tableInfo.id);
        if (tableElement) {
            tableElement.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row) return;
                const cellText = row.querySelector('td').textContent.replace('#', '').trim();

                if (e.target.closest('.btn_delete')) tableInfo.deleteFn(cellText);
                else if (e.target.closest('.btn_edit')) tableInfo.editFn(cellText);
            });
        }
    });

    // Очищення модалок після закриття
    const modalsToReset = [
        { id: 'addProductModal', form: 'addProductForm', title: 'Новий товар', editId: 'editProductId' },
        { id: 'addCategoryModal', form: 'addCategoryForm', title: 'Нова категорія', editId: 'editCategoryId' },
        { id: 'addCustomerModal', form: 'addCustomerForm', title: 'Картка лояльності', editId: 'editCustomerCardNumber' },
        { id: 'addEmployeeModal', form: 'addEmployeeForm', title: 'Картка працівника', editId: 'editEmployeeId' }
    ];

    modalsToReset.forEach(m => {
        const el = document.getElementById(m.id);
        if (el) {
            el.addEventListener('hidden.bs.modal', () => {
                document.querySelector(`#${m.id} .modal-title`).textContent = m.title;
                document.getElementById(m.editId).value = "";
                document.getElementById(m.form).reset();
                if (m.id === 'addEmployeeModal') {
                    document.getElementById('emplRoleInput').value = "Касир";
                    document.querySelectorAll('.btn-role-select').forEach(btn => btn.classList.toggle('active', btn.dataset.role === "Касир"));
                }
            });
        }
    });

    // ЛОГІКА КАСИ (POS)
    const posForm = document.getElementById('posScanForm');
    const posInput = document.getElementById('posUpcInput');
    if (posForm) {
        posForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputValue = posInput.value.trim().toLowerCase();
            //пошук за точним UPC АБО назвою товару
            const storeProduct = mockStoreProducts.find(sp => {
                if (sp.upc.toLowerCase() === inputValue) return true;
                const prod = mockProducts.find(p => p.id === sp.id_product);
                return prod && prod.name.toLowerCase().includes(inputValue);
            });

            if (storeProduct) {
                const existingItem = currentReceipt.find(item => item.upc === storeProduct.upc);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    const productInfo = mockProducts.find(p => p.id === storeProduct.id_product);
                    currentReceipt.push({
                        upc: storeProduct.upc,
                        name: productInfo ? productInfo.name : "Невідомий товар",
                        price: storeProduct.selling_price,
                        quantity: 1
                    });
                }
                renderPosTable();
                calculatePosTotals();
                posInput.value = '';
            } else {
                showBeautifulAlert("Товар не знайдено на полицях!", 'danger');
            }
        });

        const posCardForm = document.getElementById('posCardForm');
        const posCardInput = document.getElementById('posCardInput');
        const posCardResult = document.getElementById('posCardResult');

        if (posCardForm) {
            posCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputValue = posCardInput.value.trim().toLowerCase();
                if (!inputValue) {
                    appliedCustomer = null;
                    posCardResult.textContent = '';
                    calculatePosTotals();
                    return;
                }
                //пошук за номером картки, прізвищем, телефоном
                const customer = mockCustomers.find(c =>
                    c.card_number.toLowerCase() === inputValue ||
                    c.surname.toLowerCase().includes(inputValue) ||
                    c.phone.includes(inputValue)
                );
                if (customer) {
                    appliedCustomer = customer;
                    posCardResult.textContent = `Застосовано: ${customer.surname} ${customer.name[0]}. (-${customer.percent}%)`;
                    posCardResult.className = 'small mt-2 fw-semibold text-success';
                } else {
                    appliedCustomer = null;
                    posCardResult.textContent = 'Картку не знайдено!';
                    posCardResult.className = 'small mt-2 fw-semibold text-danger';
                }
                calculatePosTotals();
            });
        }
    }

    // Вибір ролі працівника
    const roleBtns = document.querySelectorAll('.btn-role-select');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('emplRoleInput').value = btn.dataset.role;
        });
    });

    // Відображення сторінки
    document.body.classList.add('loaded');
});

// ==========================================
// 7. ІНІЦІАЛІЗАЦІЯ ФОРМ (POST / PUT)
// ==========================================
function setupCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editCategoryId').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const data = { category_name: document.getElementById('categoryNameInput').value.trim() };

        submitBtn.disabled = true;
        const res = editId
            ? await apiMutate(`/categories/${editId}`, 'PUT', data)
            : await apiMutate('/categories/', 'POST', data);
        submitBtn.disabled = false;

        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addCategoryModal')).hide();
            showBeautifulAlert('Успішно збережено!', 'success');
        }
    });
}

function setupProductForm() {
    const form = document.getElementById('addProductForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editProductId').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        const data = {
            product_name: document.getElementById('productNameInput').value.trim(),
            manufacturer: document.getElementById('productManufacturerInput').value.trim(),
            characteristics: document.getElementById('productCharsInput').value.trim(),
            category_number: parseInt(document.getElementById('categorySelectInput').value)
        };

        submitBtn.disabled = true;
        const res = editId
            ? await apiMutate(`/products/${editId}`, 'PUT', data)
            : await apiMutate('/products/', 'POST', data);
        submitBtn.disabled = false;

        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).hide();
            showBeautifulAlert('Успішно збережено!', 'success');
        }
    });
}

function setupStoreProductForm() {
    const form = document.getElementById('addStoreProductForm');
    if (!form) return;

    const promoSwitch = document.getElementById('spPromoInput');
    const promoText = document.getElementById('promoStatusText');
    const priceInput = document.getElementById('spPriceInput');
    if (promoSwitch) {
        promoSwitch.addEventListener('change', function() {
            promoText.textContent = this.checked ? "Так" : "Ні";
            if (this.checked) {
                priceInput.disabled = true;
                priceInput.value = "0";
                priceInput.placeholder = "-20% від базової";
            } else {
                priceInput.disabled = false;
                priceInput.placeholder = "";
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const upcInput = document.getElementById('spUpcInput').value.trim();
        const isEditMode = document.getElementById('isEditMode').value === "true";
        const submitBtn = form.querySelector('button[type="submit"]');

        const data = {
            UPC: upcInput,
            upc_prom: null,
            id_product: parseInt(document.getElementById('spProductSelect').value),
            selling_price: parseFloat(document.getElementById('spPriceInput').value) || 0,
            products_number: parseInt(document.getElementById('spQuantityInput').value),
            promotional_product: document.getElementById('spPromoInput').checked
        };

        submitBtn.disabled = true;
        const res = isEditMode
            ? await apiMutate(`/store-products/${upcInput}`, 'PUT', data)
            : await apiMutate('/store-products/', 'POST', data);
        submitBtn.disabled = false;

        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addStoreProductModal')).hide();
            resetStoreProductForm();
            showBeautifulAlert('Успішно збережено!', 'success');
        }
    });

    const modalEl = document.getElementById('addStoreProductModal');
    if (modalEl) modalEl.addEventListener('hidden.bs.modal', resetStoreProductForm);
}

function setupEmployeeForm() {
    const form = document.getElementById('addEmployeeForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editEmployeeId').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        const data = {
            id_employee: document.getElementById('emplPasswordInput').value ? document.getElementById('editEmployeeId').value : undefined, // для POST
            password: document.getElementById('emplPasswordInput').value,
            empl_surname: document.getElementById('emplSurnameInput').value,
            empl_name: document.getElementById('emplNameInput').value,
            empl_patronymic: document.getElementById('emplPatronymicInput').value,
            empl_role: document.getElementById('emplRoleInput').value,
            salary: parseFloat(document.getElementById('emplSalaryInput').value),
            date_of_start: document.getElementById('emplStartInput').value,
            date_of_birth: document.getElementById('emplBirthInput').value,
            phone_number: document.getElementById('emplPhoneInput').value,
            city: document.getElementById('emplCityInput').value,
            street: document.getElementById('emplStreetInput').value,
            zip_code: document.getElementById('emplZipInput').value
        };

        submitBtn.disabled = true;
        let res;
        if (editId) {
            delete data.password;
            delete data.id_employee;
            res = await apiMutate(`/employees/${editId}`, 'PUT', data);
        } else {
            data.id_employee = editId || `E${Math.floor(Math.random() * 1000)}`;
            res = await apiMutate('/employees/', 'POST', data);
        }
        submitBtn.disabled = false;

        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addEmployeeModal')).hide();
            showBeautifulAlert('Успішно збережено!', 'success');
        }
    });
}

function setupCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editCustomerCardNumber').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        const data = {
            card_number: editId || `C${Math.floor(Math.random() * 10000)}`, // Генерація ID для POST
            cust_surname: document.getElementById('custSurnameInput').value.trim(),
            cust_name: document.getElementById('custNameInput').value.trim(),
            cust_patronymic: document.getElementById('custPatronymicInput').value.trim(),
            phone_number: document.getElementById('custPhoneInput').value.trim(),
            percent: parseInt(document.getElementById('custPercentInput').value),
            city: document.getElementById('custCityInput').value.trim(),
            street: document.getElementById('custStreetInput').value.trim(),
            zip_code: document.getElementById('custZipInput').value.trim()
        };

        submitBtn.disabled = true;
        const res = editId
            ? await apiMutate(`/customer-cards/${editId}`, 'PUT', data)
            : await apiMutate('/customer-cards/', 'POST', data);
        submitBtn.disabled = false;

        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addCustomerModal')).hide();
            showBeautifulAlert('Успішно збережено!', 'success');
        }
    });
}

// ==========================================
// 8. ТРИГЕРИ МОДАЛЬНИХ ВІКОН
// ==========================================
function deleteCategory(id) { itemToDeleteId = id; itemToDeleteType = 'category'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteProduct(id) { itemToDeleteId = id; itemToDeleteType = 'product'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteStoreProduct(upc) { itemToDeleteId = upc; itemToDeleteType = 'store_product'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteCheck(checkNumber) { itemToDeleteId = checkNumber; itemToDeleteType = 'check'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteEmployee(id) { itemToDeleteId = id; itemToDeleteType = 'employee'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteCustomer(id) { itemToDeleteId = id; itemToDeleteType = 'customer'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }

function prepareEditCategory(id) {
    const cat = mockCategories.find(c => c.category_number === parseInt(id));
    if (!cat) return;
    document.getElementById('editCategoryId').value = cat.category_number;
    document.getElementById('categoryNameInput').value = cat.category_name;
    document.querySelector('#addCategoryModal .modal-title').textContent = "Редагувати категорію";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addCategoryModal')).show();
}

function prepareEditProduct(id) {
    const prod = mockProducts.find(p => p.id === parseInt(id));
    if (!prod) return;
    document.getElementById('editProductId').value = prod.id;
    document.getElementById('productNameInput').value = prod.name;
    document.getElementById('productManufacturerInput').value = prod.manufacturer || "";
    document.getElementById('productCharsInput').value = prod.chars;
    document.getElementById('categorySelectInput').value = prod.category_id;
    document.querySelector('#addProductModal .modal-title').textContent = "Редагувати товар";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).show();
}

function prepareEditStoreProduct(upc) {
    const sp = mockStoreProducts.find(item => item.upc === upc);
    if (!sp) return;

    document.getElementById('isEditMode').value = "true";
    const upcInput = document.getElementById('spUpcInput');
    upcInput.value = sp.upc;
    upcInput.readOnly = true;
    upcInput.classList.add('bg-light');

    document.getElementById('spProductSelect').value = sp.id_product;
    document.getElementById('spPriceInput').value = sp.selling_price;
    document.getElementById('spQuantityInput').value = sp.products_number;

    const promoSwitch = document.getElementById('spPromoInput');
    promoSwitch.checked = sp.promotional_product;
    document.getElementById('promoStatusText').textContent = sp.promotional_product ? "Так" : "Ні";

    document.querySelector('#addStoreProductModal .modal-title').textContent = "Редагувати партію";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addStoreProductModal')).show();
}

function prepareEditEmployee(id) {
    const empl = mockEmployees.find(e => e.id === id);
    if (!empl) return;

    document.getElementById('editEmployeeId').value = empl.id;
    document.getElementById('emplPasswordInput').value = ""; // Пароль зазвичай не тягнуть з БД
    document.getElementById('emplSurnameInput').value = empl.surname;
    document.getElementById('emplNameInput').value = empl.name;
    document.getElementById('emplPatronymicInput').value = empl.patronymic || "";
    document.getElementById('emplBirthInput').value = empl.birth_date;
    document.getElementById('emplStartInput').value = empl.start_date;
    document.getElementById('emplPhoneInput').value = empl.phone;
    document.getElementById('emplSalaryInput').value = empl.salary;
    document.getElementById('emplCityInput').value = empl.city;
    document.getElementById('emplStreetInput').value = empl.street;
    document.getElementById('emplZipInput').value = empl.zip;

    document.getElementById('emplRoleInput').value = empl.role;
    document.querySelectorAll('.btn-role-select').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === empl.role);
    });

    document.querySelector('#addEmployeeModal .modal-title').textContent = "Редагувати працівника";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addEmployeeModal')).show();
}

function prepareEditCustomer(cardNumber) {
    const cust = mockCustomers.find(c => c.card_number === cardNumber);
    if (!cust) return;

    document.getElementById('editCustomerCardNumber').value = cust.card_number;
    document.getElementById('custSurnameInput').value = cust.surname;
    document.getElementById('custNameInput').value = cust.name;
    document.getElementById('custPatronymicInput').value = cust.patronymic || "";
    document.getElementById('custPhoneInput').value = cust.phone;
    document.getElementById('custPercentInput').value = cust.percent;
    document.getElementById('custCityInput').value = cust.city || "";
    document.getElementById('custStreetInput').value = cust.street || "";
    document.getElementById('custZipInput').value = cust.zip || "";

    document.querySelector('#addCustomerModal .modal-title').textContent = "Редагувати клієнта";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addCustomerModal')).show();
}

// ==========================================
// 9. VIEW DETAILED INFO
// ==========================================
function viewCheckDetails(checkNumber) {
    const chk = mockChecks.find(c => c.check_number === checkNumber);
    if (!chk) return;

    const empl = mockEmployees.find(e => e.id === chk.id_employee);
    document.getElementById('v-check-id').textContent = `Чек #${chk.check_number}`;
    document.getElementById('v-check-cashier').textContent = empl ? `${empl.surname} ${empl.name}` : "Невідомий";
    document.getElementById('v-check-date').textContent = chk.print_date;

    apiFetch(`/checks/${checkNumber}/details`).then(data => {
        const tbody = document.getElementById('v-check-products');
        if(data && data.items) {
            tbody.innerHTML = data.items.map(sale => `
                <tr>
                    <td class="fw-semibold">${sale.product_name} <br><span class="text-muted small">UPC: ${sale.upc}</span></td>
                    <td>${sale.quantity} шт.</td>
                    <td>${sale.selling_price.toFixed(2)}</td>
                    <td class="text-end fw-bold">${(sale.quantity * sale.selling_price).toFixed(2)}</td>
                </tr>
            `).join('');
        }
    });

    const cardEl = document.getElementById('v-check-card');
    if (chk.card_number) {
        const cust = mockCustomers.find(c => c.card_number === chk.card_number);
        cardEl.textContent = `Картка: ${chk.card_number} (Знижка ${cust ? cust.percent : 0}%)`;
        cardEl.style.display = 'inline-block';
    } else {
        cardEl.style.display = 'none';
    }

    document.getElementById('v-check-vat').textContent = chk.vat.toFixed(2);
    document.getElementById('v-check-total').textContent = chk.sum_total.toFixed(2);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCheckModal')).show();
}

window.viewEmployeeDetails = async (id) => {
    let empl = mockEmployees.find(e => e.id === id);
    if (!empl) {
        const me = await apiFetch('/employees/me');
        if (me) {
            empl = {
                id: me.id_employee, surname: me.empl_surname, name: me.empl_name, patronymic: me.empl_patronymic,
                role: me.empl_role, salary: me.salary, start_date: me.date_of_start, birth_date: me.date_of_birth,
                phone: me.phone_number, city: me.city, street: me.street, zip: me.zip_code
            };
        }
    }
    if (!empl) {
        showBeautifulAlert("Не вдалося завантажити дані профілю", "danger");
        return;
    }
    const header = document.getElementById('v-header');
    if (header) {
        header.className = `modal-header border-0 ${empl.role === 'Менеджер' ? 'badge-manager' : 'badge-cashier'}`;
    }
    document.getElementById('v-id').textContent = `Табельний номер: #${empl.id}`;
    document.getElementById('v-fullName').textContent = `${empl.surname} ${empl.name} ${empl.patronymic || ''}`;
    document.getElementById('v-phone').textContent = empl.phone;
    document.getElementById('v-salary').textContent = `${empl.salary} грн`;
    document.getElementById('v-birth').textContent = empl.birth_date;
    document.getElementById('v-start').textContent = empl.start_date;
    document.getElementById('v-address').textContent = `${empl.zip || ''}, м. ${empl.city || ''}, ${empl.street || ''}`;

    const roleBadge = document.getElementById('v-role');
    if (roleBadge) {
        roleBadge.textContent = empl.role;
        roleBadge.className = `badge-empl ${empl.role === 'Менеджер' ? 'badge-manager' : 'badge-cashier'}`;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewEmployeeModal')).show();
};

function viewCustomerDetails(cardNumber) {
    const cust = mockCustomers.find(c => c.card_number === cardNumber);
    if (!cust) return;

    document.getElementById('v-cust-id').textContent = `Номер карти: ${cust.card_number}`;
    document.getElementById('v-cust-fullName').textContent = `${cust.surname} ${cust.name} ${cust.patronymic || ''}`;
    document.getElementById('v-cust-percent').textContent = cust.percent;
    document.getElementById('v-cust-phone').textContent = cust.phone;

    const addressEl = document.getElementById('v-cust-address');
    if (cust.city || cust.street) {
        addressEl.textContent = `${cust.zip ? cust.zip + ', ' : ''}м. ${cust.city}, ${cust.street}`;
        addressEl.classList.remove('text-muted');
    } else {
        addressEl.textContent = "Не вказано";
        addressEl.classList.add('text-muted');
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCustomerModal')).show();
}

// ==========================================
// 10. ІНШІ УТИЛІТИ (POS, ОЧИЩЕННЯ)
// ==========================================
// Функція для генерації звіту з будь-якої таблиці
// Функція для генерації звіту з будь-якої таблиці
window.generateReport = (pageTitle, tableBodyId) => {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const sourceTable = tbody.closest('table');
    const tableClone = sourceTable.cloneNode(true);
    const rows = tableClone.querySelectorAll('tr');

    // Видаляємо колонку з кнопками "Дії" та іконки сортування
    rows.forEach(row => {
        const lastCell = row.lastElementChild;
        if (lastCell && (lastCell.textContent.includes('Дії') || lastCell.innerHTML.includes('btn') || lastCell.classList.contains('cashier-hide-col'))) {
            lastCell.remove();
        }
        const icons = row.querySelectorAll('.bi-arrow-down-up');
        icons.forEach(i => i.remove());
    });

    const printBody = document.getElementById('reportPrintBody');
    printBody.innerHTML = '';
    document.getElementById('reportPreviewTitle').textContent = pageTitle;

    // 1. РОБИМО ТАБЛИЦЮ НА ВСЮ ШИРИНУ ЕКРАНА/ПАПЕРУ
    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.className = 'table mb-0';

    const thead = tableClone.querySelector('thead');
    const firstRow = tableClone.querySelector('tr');
    const colCount = firstRow ? firstRow.children.length : 1;

    // 2. ВЕРХНІЙ КОЛОНТИТУЛ (Друкується на кожній сторінці)
    const headerRow = document.createElement('tr');
    const headerCell = document.createElement('th');
    headerCell.colSpan = colCount;
    headerCell.style.border = "none";
    headerCell.style.backgroundColor = "white";
    headerCell.style.paddingBottom = "15px";
    headerCell.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <h2 style="margin: 0; font-size: 22px; color: black; font-weight: bold;">Міні-супермаркет «ZLAGODA»</h2>
            <p style="margin: 5px 0 10px; font-size: 16px; color: black;">Офіційний звіт: ${pageTitle}</p>
            <div style="border-bottom: 2px solid black; width: 100%;"></div>
        </div>
    `;
    headerRow.appendChild(headerCell);
    thead.insertBefore(headerRow, thead.firstChild);

    // 3. НИЖНІЙ КОЛОНТИТУЛ (Друкується в кінці сторінки)
    let tfoot = tableClone.querySelector('tfoot');
    if (!tfoot) {
        tfoot = document.createElement('tfoot');
        tableClone.appendChild(tfoot);
    }
    const footerRow = document.createElement('tr');
    const footerCell = document.createElement('td');
    footerCell.colSpan = colCount;
    footerCell.style.border = "none";
    footerCell.style.backgroundColor = "white";
    footerCell.style.paddingTop = "15px";
    
    const now = new Date().toLocaleString('uk-UA');
    const userName = sessionStorage.getItem('userName') || 'Працівник';
    footerCell.innerHTML = `
        <div style="border-top: 2px solid black; width: 100%; margin-bottom: 5px;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: black; font-weight: 600;">
            <span>Сформовано: ${now}</span>
            <span>Менеджер: ${userName}</span>
        </div>
    `;
    footerRow.appendChild(footerCell);
    tfoot.appendChild(footerRow);

    // Стилізуємо таблицю для принтера (чорні рамки, без фону)
    tableClone.querySelectorAll('th:not([colspan]), td:not([colspan])').forEach(cell => {
        cell.style.border = '1px solid black';
        cell.style.padding = '8px';
        cell.style.color = 'black';
        cell.style.backgroundColor = 'white';
    });

    // 4. ТРЮК ДЛЯ ПРИХОВУВАННЯ URL БЕЗ ЗМІНИ STYLE.CSS
    let printStyle = document.getElementById('dynamicPrintStyle');
    if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = 'dynamicPrintStyle';
        document.head.appendChild(printStyle);
    }
    // Встановлюємо відступи паперу в 0 (знищує URL браузера), але додаємо внутрішній відступ тілу
    printStyle.innerHTML = `
        @media print {
            @page { margin: 0; } 
            body { padding: 1cm; } 
        }
    `;

    printBody.appendChild(tableClone);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('reportPreviewModal')).show();
};

window.executePrint = () => {
    window.print();
};

function togglePasswordVisibility() {
    const passInput = document.getElementById('emplPasswordInput');
    const icon = document.querySelector('.password-toggle-icon');
    if (passInput.type === "password") {
        passInput.type = "text";
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        passInput.type = "password";
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

function resetStoreProductForm() {
    const form = document.getElementById('addStoreProductForm');
    if(form) form.reset();
    document.querySelector('#addStoreProductModal .modal-title').textContent = "Товар на полиці";
    document.getElementById('isEditMode').value = "false";
    const upcInput = document.getElementById('spUpcInput');
    if (upcInput) {
        upcInput.readOnly = false;
        upcInput.classList.remove('bg-light');
    }
    const promoText = document.getElementById('promoStatusText');
    if(promoText) promoText.textContent = "Ні";
}

function calculatePosTotals() {
    const subtotal = currentReceipt.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (appliedCustomer) discount = subtotal * (appliedCustomer.percent / 100);
    const total = subtotal - discount;
    const vat = total * 0.2;

    document.getElementById('posSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('posDiscount').textContent = discount.toFixed(2);
    document.getElementById('posVat').textContent = vat.toFixed(2);
    document.getElementById('posTotal').textContent = total.toFixed(2);
    document.getElementById('posPayBtn').disabled = currentReceipt.length === 0;
}

window.changeQty = (index, delta) => {
    currentReceipt[index].quantity += delta;
    if (currentReceipt[index].quantity <= 0) currentReceipt.splice(index, 1);
    renderPosTable();
    calculatePosTotals();
};

window.removeFromReceipt = (index) => {
    currentReceipt.splice(index, 1);
    renderPosTable();
    calculatePosTotals();
};

function showBeautifulAlert(message, type = 'danger') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
    const icon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
    const toastHTML = `
        <div class="toast align-items-center text-white ${bgColor} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2 fs-6">
                    <i class="bi ${icon} fs-4"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = toastHTML;
    const toastElement = tempDiv.firstElementChild;
    toastContainer.appendChild(toastElement);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ==========================================
// 11. ФІЛЬТРАЦІЯ ТА СОРТУВАННЯ (ВИПРАВЛЕНО)
// ==========================================

window.applyFilters = async () => {
    const activeSection = document.querySelector('.filter-section[style*="display: block"]');
    if (!activeSection) return;

    const pageType = activeSection.id.replace('filter-', '');
    let endpoint = '';
    let filteredData = [];

    try {
        if (pageType === 'products') {
            // 1. Отримуємо всі вибрані категорії з чекбоксів
            const checkedCats = Array.from(document.querySelectorAll('#filterCategoryList input:checked')).map(cb => cb.value);
            savedFilters['products'].categories = checkedCats;

            // 2. Отримуємо ПОВНИЙ список товарів з бази
            const dbProducts = await apiFetch('/products/');

            // 3. Фільтруємо на фронті (порівнюємо p.category_number із вибраними id)
            filteredData = checkedCats.length > 0
                ? dbProducts.filter(p => checkedCats.includes(p.category_number.toString()))
                : dbProducts;

            // 4. Оновлюємо mockProducts та рендеримо
            mockProducts = filteredData.map(p => ({
                id: p.id_product,
                name: p.product_name,
                manufacturer: p.manufacturer,
                chars: p.characteristics,
                category_id: p.category_number // Важливо для renderProducts
            }));
            renderProducts(mockProducts);

        } else if (pageType === 'customers') {
            const percentVal = document.getElementById('filterPercent').value;
            savedFilters['customers'].percent = percentVal;
            // Якщо 0 або пусто - вантажимо всіх. Інакше - шукаємо конкретний відсоток.
            if (!percentVal || percentVal === "0") {
                endpoint = '/customer-cards/';
            } else {
                endpoint = `/customer-cards/?percent=${percentVal}`;
            }
            const dbCustomers = await apiFetch(endpoint);
            mockCustomers = dbCustomers.map(c => ({
                card_number: c.card_number,
                surname: c.cust_surname,
                name: c.cust_name,
                patronymic: c.cust_patronymic,
                phone: c.phone_number,
                city: c.city,
                street: c.street,
                zip: c.zip_code,
                percent: c.percent // Переконайся, що в БД це поле так називається
            }));
            renderCustomers(mockCustomers);

        } else if (pageType === 'employees') {
            // Логіка для працівників (залишаємо як було, вона працює через чекбокси)
            const isManager = document.getElementById('fRoleManager').checked;
            const isCashier = document.getElementById('fRoleCashier').checked;
            savedFilters['employees'].manager = isManager;
            savedFilters['employees'].cashier = isCashier;

            let allEmpl = await apiFetch('/employees/');
            if (isManager && !isCashier) filteredData = allEmpl.filter(e => e.empl_role === 'Менеджер');
            else if (!isManager && isCashier) filteredData = allEmpl.filter(e => e.empl_role === 'Касир');
            else filteredData = allEmpl;

            mockEmployees = filteredData.map(e => ({
                id: e.id_employee, surname: e.empl_surname, name: e.empl_name,
                role: e.empl_role, salary: e.salary, phone: e.phone_number
            }));
            renderEmployees(mockEmployees);

        } else if (pageType === 'store-products') {
            // Логіка для товарів у магазині (UPC регістр)
            const promoVal = document.getElementById('filterPromoSelect').value;
            savedFilters['store-products'].promo = promoVal;
            //змінив sort_by на name
            endpoint = `/store-products/?sort_by=name`;
            if (promoVal !== 'all') {
                endpoint += `&promotional=${promoVal === 'yes' ? 'true' : 'false'}`;
            }

            const dbStoreProducts = await apiFetch(endpoint);
            mockStoreProducts = dbStoreProducts.map(sp => ({
                upc: sp.upc || sp.UPC,
                id_product: sp.id_product,
                selling_price: parseFloat(sp.selling_price),
                products_number: sp.products_number,
                promotional_product: sp.promotional_product
            }));
            renderStoreProducts(mockStoreProducts);
        } else if (pageType === 'checks') {
            const cashierVal = document.getElementById('filterCheckCashier').value;
            const startVal = document.getElementById('filterCheckStart').value;
            const endVal = document.getElementById('filterCheckEnd').value;
            savedFilters['checks'].cashier = cashierVal;
            savedFilters['checks'].start = startVal;
            savedFilters['checks'].end = endVal;

            let params = [];
            if (cashierVal !== 'all') params.push(`id_employee=${encodeURIComponent(cashierVal)}`);
            if (startVal) params.push(`start_date=${encodeURIComponent(startVal)}`);
            if (endVal) params.push(`end_date=${encodeURIComponent(endVal)}`);
            endpoint = `/checks/${params.length ? '?' + params.join('&') : ''}`;

            const dbChecks = await apiFetch(endpoint);
            mockChecks = dbChecks.map(c => ({
                check_number: c.check_number, id_employee: c.id_employee, card_number: c.card_number,
                print_date: new Date(c.print_date).toLocaleString('uk-UA'),
                sum_total: parseFloat(c.sum_total), vat: parseFloat(c.vat)
            }));
            renderChecks(mockChecks);
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById('filterModal')).hide();
        showBeautifulAlert('Фільтри застосовано!', 'success');

    } catch (error) {
        showBeautifulAlert('Помилка фільтрації', 'danger');
    }
};

window.openFilterModal = (pageType) => {
    document.querySelectorAll('.filter-section').forEach(el => el.style.display = 'none');

    const section = document.getElementById(`filter-${pageType}`);
    if (section) section.style.display = 'block';

    const titles = {
        'employees': 'Вибір персоналу',
        'customers': 'Фільтр за знижкою',
        'products': 'Вибір категорій',
        'store-products': 'Фільтр акцій',
        'checks': 'Звіти за період'
    };
    document.getElementById('filterModalTitle').textContent = titles[pageType] || 'Фільтрація';

    // ВІДНОВЛЕННЯ СТАНУ З ПАМ'ЯТІ (savedFilters)
    if (pageType === 'employees') {
        const managerCheck = document.getElementById('fRoleManager');
        const cashierCheck = document.getElementById('fRoleCashier');
        if (managerCheck) managerCheck.checked = savedFilters['employees'].manager;
        if (cashierCheck) cashierCheck.checked = savedFilters['employees'].cashier;
    }

    if (pageType === 'customers') {
        const percentInput = document.getElementById('filterPercent');
        if (percentInput) percentInput.value = savedFilters['customers'].percent;
    }

    if (pageType === 'products') {
        const container = document.getElementById('filterCategoryList');
        if (container) {
            container.innerHTML = mockCategories.map(cat => {
                const isChecked = savedFilters['products'].categories === null
                    ? true
                    : savedFilters['products'].categories.includes(cat.category_number.toString());

                return `
                <div class="form-check mb-1">
                    <input class="form-check-input zlagoda-checkbox" type="checkbox" value="${cat.category_number}" id="catCheck${cat.category_number}" ${isChecked ? 'checked' : ''}>
                    <label class="form-check-label small" for="catCheck${cat.category_number}">${cat.category_name}</label>
                </div>
            `}).join('');
        }
    }

    if (pageType === 'store-products') {
        const promoSelect = document.getElementById('filterPromoSelect');
        if (promoSelect) promoSelect.value = savedFilters['store-products'].promo;
    }

    if (pageType === 'checks') {
        const select = document.getElementById('filterCheckCashier');
        if (select && select.options.length <= 1) {
            const cashiers = mockEmployees.filter(e => e.role === 'Касир');
            cashiers.forEach(c => {
                const opt = new Option(`${c.surname} ${c.name[0]}.`, c.id);
                select.add(opt);
            });
        }

        if (select) select.value = savedFilters['checks'].cashier;

        const startInput = document.getElementById('filterCheckStart');
        if (startInput) startInput.value = savedFilters['checks'].start;

        const endInput = document.getElementById('filterCheckEnd');
        if (endInput) endInput.value = savedFilters['checks'].end;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('filterModal')).show();
};

window.changeFilterPercent = (delta) => {
    const input = document.getElementById('filterPercent');
    if (!input) return;
    let val = (parseInt(input.value) || 0) + delta;
    input.value = Math.max(0, Math.min(100, val));
};