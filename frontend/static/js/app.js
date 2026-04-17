/*
TODO: 1. Додати фільтрацію:
    - працівник: за роллю
    - клієнти: з пенвим відсотком знижки
    - товари: за категорією
    - това в магазині: за/без акції
    - чеки: створені певним касиром, за певний період (також аби сума чеків відносно цього рахувалась)
*/

//data
let itemToDeleteId = null;
let itemToDeleteType = null;
let currentSortColumn = '';
let isAscending = true;
let currentReceipt = [];
let appliedCustomer = null;

const mockCategories = [
    { category_number: 1, category_name: "Молочні продукти" },
    { category_number: 2, category_name: "М'ясні вироби" },
    { category_number: 3, category_name: "Овочі та фрукти" },
    { category_number: 4, category_name: "Напої" }
];

const mockProducts = [
    { id: 101, name: "Молоко 2.5%", manufacturer: "Фермерське", chars: "Пакет 1л, фермерське", category_id: 1 },
    { id: 102, name: "Яблука Голден", manufacturer: "Україна", chars: "Вагові", category_id: 3 }
];

const mockStoreProducts = [
    { upc: "123456789012", id_product: 101, selling_price: 45.50, products_number: 100, promotional_product: false },
    { upc: "987654321098", id_product: 102, selling_price: 25.00, products_number: 50, promotional_product: true }
];

const mockEmployees = [
    { 
        id: 12345, password: "123", surname: "Мельник", name: "Анна", patronymic: "Олексіївна",
        role: "Менеджер", salary: 35000, start_date: "2023-01-10", birth_date: "1990-05-14",
        phone: "+380951234567", city: "Київ", street: "вул. Хрещатик 15", zip: "02100"
    },
    {
        id: 54321, password: "0000", surname: "Сидоренко", name: "Іван", patronymic: "Петрович",
        role: "Касир", salary: 15000, start_date: "2023-03-05", birth_date: "1995-07-22",
        phone: "+380671112233", city: "Київ", street: "Польова 12", zip: "03056"
    }
];

const mockCustomers = [
    { 
        card_number: "1", surname: "Коваленко", name: "Олена", patronymic: "Іванівна", 
        phone: "+380671112233", city: "Київ", street: "Польова 12", zip: "03056", percent: 5 
    },
    { 
        card_number: "2", surname: "Іванов", name: "Петро", patronymic: "Олегович", 
        phone: "+380509998877", city: "", street: "", zip: "", percent: 10 
    }
];

const mockChecks = [
    { check_number: "1", id_employee: 54321, card_number: "1", print_date: "2023-10-25 14:30", sum_total: 110.20, vat: 18.37 },
    { check_number: "2", id_employee: 54321, card_number: "", print_date: "2023-10-25 15:45", sum_total: 45.50, vat: 7.58 }
];

const mockSales = [
    { UPC: "123456789012", check_number: "1", product_number: 2, selling_price: 45.50 },
    { UPC: "987654321098", check_number: "1", product_number: 1, selling_price: 25.00 },
    { UPC: "123456789012", check_number: "2", product_number: 1, selling_price: 45.50 }
];

//rendering

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
            </tr>
        `;
    }).join('');
}

function renderChecks(data) {
    const tableBody = document.getElementById('checkTableBody');
    if (!tableBody) return;
    const totalSum = data.reduce((sum, chk) => sum + chk.sum_total, 0);
    const sumElement = document.getElementById('totalChecksSum');
    if (sumElement) {
        sumElement.textContent = totalSum.toFixed(2);
    }

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
            </tr>
        `;
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
                <button class="btn btn-sm p-1 me-2" onclick="viewEmployeeDetails(${empl.id})" title="Детальна інформація">
                    <i class="bi bi-info-circle icon-zlagoda fs-5"></i>
                </button>
                <button class="btn btn-sm btn_edit me-2" onclick="prepareEditEmployee(${empl.id})">Редагувати</button>
                <button class="btn btn-sm btn_delete" onclick="deleteEmployee(${empl.id})">Видалити</button>
            </td>
        </tr>
    `).join('');
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
        </tr>
    `).join('');
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
                    <button class="btn btn-sm btn-qty-pos border-0 rounded-0 px-2" onclick="changeQty(${index}, -1)">-</button>
                    <div class="border-start border-end d-flex align-items-center justify-content-center fw-bold bg-white" 
                         style="width: 40px; border-color: var(--text-color) !important; color: var(--text-color);">
                        ${item.quantity}
                    </div>
                    
                    <button class="btn btn-sm btn-qty-pos border-0 rounded-0 px-2" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </td>
            <td class="fw-bold">${(item.price * item.quantity).toFixed(2)}</td>
            <td class="text-end pe-4">
                <button class="btn btn-delete-pos p-0 fs-5" onclick="removeFromReceipt(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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

//main logic

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const enteredID = parseInt(document.getElementById('loginInput').value);
        const enteredPass = document.getElementById('passwordInput').value;
        const alertMessage = document.getElementById('alertMessage');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        alertMessage.textContent = '';
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        
        setTimeout(() => {
            const user = mockEmployees.find(e => e.id === enteredID && e.password === enteredPass);

            if (user) {
                const initials = `${user.surname} ${user.name[0]}. ${user.patronymic ? user.patronymic[0] + '.' : ''}`.trim();
                sessionStorage.setItem('userName', initials);
                sessionStorage.setItem('userRole', user.role); 
                sessionStorage.setItem('userId', user.id);
                alertMessage.style.color = 'var(--primary_color)';
                alertMessage.textContent = `Вітаємо, ${initials}!`;

                setTimeout(() => {
                    if (user.role === 'Менеджер') {
                        window.location.href = '../manager/home.html';
                    } else if (user.role === 'Касир') {
                        window.location.href = '../cashier/home.html';
                    }
                }, 1000);

            } else {
                alertMessage.style.color = 'red';
                alertMessage.textContent = 'Невірний ID або пароль';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }, 800);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const role = sessionStorage.getItem('userRole');
    if (role == 'Касир') {
        document.body.classList.add('cashier-mode');
    }
    
    const modalsPlaceholder = document.getElementById('modals_placeholder');
    if (modalsPlaceholder) {
        try {
            const res = await fetch('../shared/modals.html');
            modalsPlaceholder.innerHTML = await res.text();
        } catch (error) {
            console.error("Помилка завантаження модалок:", error);
        }
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
                    const modalEl = document.getElementById('logoutModal');
                    const logoutModal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    logoutModal.show();
                });
            }

            displayUserName();

        } catch (error) {
            console.error("Помилка завантаження меню:", error);
        }
    }

    updateGreeting();

    if (document.getElementById('categoryTableBody')) {
        renderCategories(mockCategories);
        setupSearch('categorySearch', mockCategories, renderCategories, 'category_name');
        setupCategoryForm();
    }

    if (document.getElementById('productTableBody')) {
        renderProducts(mockProducts);
        populateCategoryDropdown();
        setupSearch('productSearch', mockProducts, renderProducts, 'name');
        setupProductForm();
    }

    if (document.getElementById('storeProductTableBody')) {
        mockStoreProducts.forEach(sp => {
        const prod = mockProducts.find(p => p.id === sp.id_product); 
        sp.productName = prod ? prod.name : 'Невідомий товар';
    });
        renderStoreProducts(mockStoreProducts);
        populateProductDropdown();
        setupSearch('storeProductSearch', mockStoreProducts, renderStoreProducts, 'upc');
        setupStoreProductForm();
    }

    if (document.getElementById('checkTableBody')) {
        renderChecks(mockChecks);
        setupSearch('checkSearch', mockChecks, renderChecks, 'check_number');
    }

    if (document.getElementById('employeeTableBody')) {
        renderEmployees(mockEmployees);
        setupSearch('employeeSearch', mockEmployees, renderEmployees, 'surname');
        setupEmployeeForm();
    }

    if (document.getElementById('customerTableBody')) {
        renderCustomers(mockCustomers);
        setupSearch('customerSearch', mockCustomers, renderCustomers, 'surname');
        setupCustomerForm();
    }

    const confirmLogout = document.getElementById('confirmLogout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '../shared/login.html';
        });
    }

    const categoryTable = document.getElementById('categoryTableBody');
    if (categoryTable) {
        categoryTable.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const id = parseInt(row.querySelector('td').textContent.replace('#', ''));

            if (e.target.classList.contains('btn_delete')) {
                deleteCategory(id);
            } else if (e.target.classList.contains('btn_edit')) {
                prepareEditCategory(id);
            }
        });
    }

    const productTable = document.getElementById('productTableBody');
    if (productTable) {
        productTable.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const id = parseInt(row.querySelector('td').textContent.replace('#', ''));

            if (e.target.classList.contains('btn_delete')) {
                deleteProduct(id);
            } else if (e.target.classList.contains('btn_edit')) {
                prepareEditProduct(id);
            }
        });
    }

    const productModalEl = document.getElementById('addProductModal');
    if (productModalEl) {
        productModalEl.addEventListener('hidden.bs.modal', () => {
            document.querySelector('#addProductModal .modal-title').textContent = "Новий товар";
            document.getElementById('editProductId').value = "";
            document.getElementById('addProductForm').reset();
        });
    }

    const employeeModalEl = document.getElementById('addEmployeeModal');
    if (employeeModalEl) {
    employeeModalEl.addEventListener('hidden.bs.modal', () => {
        document.querySelector('#addEmployeeModal .modal-title').textContent = "Картка працівника";
        document.getElementById('editEmployeeId').value = "";
        const form = document.getElementById('addEmployeeForm');
        form.reset();
        document.getElementById('emplRoleInput').value = "Касир";
        document.querySelectorAll('.btn-role-select').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.role === "Касир");
        });
    });

    }
    
    const posForm = document.getElementById('posScanForm');
    const posInput = document.getElementById('posUpcInput');

    if (posForm) {
        posForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const upc = posInput.value.trim();
            
            const storeProduct = mockStoreProducts.find(sp => sp.upc === upc);

            if (storeProduct) {
                const existingItem = currentReceipt.find(item => item.upc === upc);

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
                alert("Товар з таким UPC не знайдено!");
            }
        });
        const posCardForm = document.getElementById('posCardForm');
    const posCardInput = document.getElementById('posCardInput');
    const posCardResult = document.getElementById('posCardResult');

    if (posCardForm) {
        posCardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cardNumber = posCardInput.value.trim();
            
            if (!cardNumber) {
                appliedCustomer = null;
                posCardResult.textContent = '';
                calculatePosTotals();
                return;
            }

            const customer = mockCustomers.find(c => c.card_number === cardNumber);

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

   const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) {
        btnConfirmDelete.onclick = () => {
            if (itemToDeleteType === 'category') {
                const index = mockCategories.findIndex(c => c.category_number === itemToDeleteId);
                if (index !== -1) {
                    mockCategories.splice(index, 1);
                    renderCategories(mockCategories);
                }
            } else if (itemToDeleteType === 'product') {
                const index = mockProducts.findIndex(p => p.id === itemToDeleteId);
                if (index !== -1) {
                    mockProducts.splice(index, 1);
                    renderProducts(mockProducts);
                }
            } else if (itemToDeleteType === 'employee') {
                const index = mockEmployees.findIndex(e => e.id === itemToDeleteId);
                if (index !== -1) {
                    mockEmployees.splice(index, 1);
                    renderEmployees(mockEmployees);
                }
            } else if (itemToDeleteType === 'customer') {
                const index = mockCustomers.findIndex(c => c.card_number === itemToDeleteId);
                if (index !== -1) {
                    mockCustomers.splice(index, 1);
                    renderCustomers(mockCustomers);
                }
            } else if (itemToDeleteType === 'store_product') {
                const index = mockStoreProducts.findIndex(sp => sp.upc === itemToDeleteId);
                if (index !== -1) {
                    mockStoreProducts.splice(index, 1);
                    renderStoreProducts(mockStoreProducts);
                }
            } else if (itemToDeleteType === 'check') {
                const index = mockChecks.findIndex(c => c.check_number === itemToDeleteId);
                if (index !== -1) {
                    mockChecks.splice(index, 1);
                    renderChecks(mockChecks);
                }
            }

            const modalEl = document.getElementById('deleteConfirmModal');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        };
    }

    const roleBtns = document.querySelectorAll('.btn-role-select');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('emplRoleInput').value = btn.dataset.role;
        });
    });
    document.body.classList.add('loaded');
});

//additional functions

function setupSearch(inputId, data, renderFn, field) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = data.filter(item => item[field].toLowerCase().includes(value));
        renderFn(filtered);
    });
}

function setupCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editCategoryId').value;
        const nameVal = document.getElementById('categoryNameInput').value.trim();
        const newCat = {
            category_number: editId ? parseInt(editId) : mockCategories.length + 1,
            category_name: nameVal
        };
        if (editId) {
            const index = mockCategories.findIndex(c => c.category_number === parseInt(editId));
            if (index !== -1) mockCategories[index] = newCat;
        } else {
            mockCategories.push(newCat);
        }

        renderCategories(mockCategories);
        const modalEl = document.getElementById('addCategoryModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
        
        form.reset();
        document.getElementById('editCategoryId').value = "";
    });
}

function setupProductForm() {
    const form = document.getElementById('addProductForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editProductId').value;
        
        const newProduct = {
            id: editId ? parseInt(editId) : mockProducts.length + 101, // Тимчасова генерація ID
            name: document.getElementById('productNameInput').value.trim(),
            manufacturer: document.getElementById('productManufacturerInput').value.trim(),
            chars: document.getElementById('productCharsInput').value.trim(),
            category_id: parseInt(document.getElementById('categorySelectInput').value)
        };

        if (editId) {
            const index = mockProducts.findIndex(p => p.id === parseInt(editId));
            if (index !== -1) mockProducts[index] = newProduct;
        } else {
            mockProducts.push(newProduct);
        }

        renderProducts(mockProducts);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).hide();
        form.reset();
        document.getElementById('editProductId').value = "";
    });
}

function setupStoreProductForm() {
    const form = document.getElementById('addStoreProductForm');
    if (!form) return;

    const promoSwitch = document.getElementById('spPromoInput');
    const promoText = document.getElementById('promoStatusText');
    if (promoSwitch) {
        promoSwitch.addEventListener('change', function() {
            promoText.textContent = this.checked ? "Так" : "Ні";
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const upcInput = document.getElementById('spUpcInput').value.trim();
        const isEditMode = document.getElementById('isEditMode').value === "true";
        const alertMessage = document.getElementById('spAlertMessage');
        
        if (alertMessage) alertMessage.textContent = '';

        const storeProductData = {
            upc: upcInput,
            id_product: parseInt(document.getElementById('spProductSelect').value),
            selling_price: parseFloat(document.getElementById('spPriceInput').value),
            products_number: parseInt(document.getElementById('spQuantityInput').value),
            promotional_product: document.getElementById('spPromoInput').checked
        };

        if (isEditMode) {
            const index = mockStoreProducts.findIndex(sp => sp.upc === upcInput);
            if (index !== -1) mockStoreProducts[index] = storeProductData;
        } else {
            const exists = mockStoreProducts.find(sp => sp.upc === upcInput);
            if (exists) {
                if (alertMessage) {
                    alertMessage.textContent = 'Товар з таким UPC вже існує!';
                    alertMessage.style.color = 'red';
                }
                return;
            }
            mockStoreProducts.push(storeProductData);
        }

        renderStoreProducts(mockStoreProducts);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addStoreProductModal')).hide();
        resetStoreProductForm();
    });

    const modalEl = document.getElementById('addStoreProductModal');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', resetStoreProductForm);
    }
}

function setupEmployeeForm() {
    const form = document.getElementById('addEmployeeForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editEmployeeId').value;
        
        const employeeData = {
            id: editId ? parseInt(editId) : mockEmployees.length + 1,
            password: document.getElementById('emplPasswordInput').value,
            surname: document.getElementById('emplSurnameInput').value,
            name: document.getElementById('emplNameInput').value,
            patronymic: document.getElementById('emplPatronymicInput').value,
            role: document.getElementById('emplRoleInput').value,
            birth_date: document.getElementById('emplBirthInput').value,
            start_date: document.getElementById('emplStartInput').value,
            phone: document.getElementById('emplPhoneInput').value,
            salary: document.getElementById('emplSalaryInput').value,
            city: document.getElementById('emplCityInput').value,
            street: document.getElementById('emplStreetInput').value,
            zip: document.getElementById('emplZipInput').value
        };

        if (editId) {
            const index = mockEmployees.findIndex(emp => emp.id === parseInt(editId));
            if (index !== -1) mockEmployees[index] = employeeData;
        } else {
            mockEmployees.push(employeeData);
        }

        renderEmployees(mockEmployees);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addEmployeeModal')).hide();
        form.reset();
        document.getElementById('editEmployeeId').value = "";
        
        document.querySelectorAll('.btn-role-select').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-role="Касир"]').classList.add('active');
    });
}

function setupCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editCustomerCardNumber').value;
        
        const customerData = {
            card_number: editId ? parseInt(editId) : mockCustomers.length + 1,
            surname: document.getElementById('custSurnameInput').value.trim(),
            name: document.getElementById('custNameInput').value.trim(),
            patronymic: document.getElementById('custPatronymicInput').value.trim(),
            phone: document.getElementById('custPhoneInput').value.trim(),
            percent: parseInt(document.getElementById('custPercentInput').value),
            city: document.getElementById('custCityInput').value.trim(),
            street: document.getElementById('custStreetInput').value.trim(),
            zip: document.getElementById('custZipInput').value.trim()
        };

        if (editId) {
            const index = mockCustomers.findIndex(c => c.card_number === editId);
            if (index !== -1) mockCustomers[index] = customerData;
        } else {
            mockCustomers.push(customerData);
        }

        renderCustomers(mockCustomers);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addCustomerModal')).hide();
        form.reset();
        document.getElementById('editCustomerCardNumber').value = "";
    });

    const modalEl = document.getElementById('addCustomerModal');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            document.querySelector('#addCustomerModal .modal-title').textContent = "Картка лояльності";
            document.getElementById('editCustomerCardNumber').value = "";
            form.reset();
        });
    }
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

function deleteCategory(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'category';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function deleteProduct(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'product';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function deleteStoreProduct(upc) {
    itemToDeleteId = upc;
    itemToDeleteType = 'store_product';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function deleteCheck(checkNumber) {
    itemToDeleteId = checkNumber;
    itemToDeleteType = 'check';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function deleteEmployee(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'employee';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function deleteCustomer(cardNumber) {
    itemToDeleteId = cardNumber;
    itemToDeleteType = 'customer';
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function prepareEditCategory(id) {
    const cat = mockCategories.find(c => c.category_number === id);
    if (!cat) return;

    document.getElementById('editCategoryId').value = cat.category_number;
    document.getElementById('categoryNameInput').value = cat.category_name;

    document.querySelector('#addCategoryModal .modal-title').textContent = "Редагувати категорію";

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addCategoryModal'));
modal.show();
}

function prepareEditProduct(id) {
    const prod = mockProducts.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('editProductId').value = prod.id;
    document.getElementById('productNameInput').value = prod.name;
    document.getElementById('productManufacturerInput').value = prod.manufacturer || "";
    document.getElementById('productCharsInput').value = prod.chars;
    document.getElementById('categorySelectInput').value = prod.category_id;

    document.querySelector('#addProductModal .modal-title').textContent = "Редагувати товар";

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
    modal.show();
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
    document.getElementById('emplPasswordInput').value = empl.password;
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

function togglePasswordVisibility() {
    const passInput = document.getElementById('emplPasswordInput');
    const icon = document.querySelector('.password-toggle-icon'); // Шукаємо за класом
    
    if (passInput.type === "password") {
        passInput.type = "text";
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        passInput.type = "password";
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

function viewCheckDetails(checkNumber) {
    const chk = mockChecks.find(c => c.check_number === checkNumber);
    if (!chk) return;

    const empl = mockEmployees.find(e => e.id === chk.id_employee);
    document.getElementById('v-check-id').textContent = `Чек #${chk.check_number}`;
    document.getElementById('v-check-cashier').textContent = empl ? `${empl.surname} ${empl.name}` : "Невідомий";
    document.getElementById('v-check-date').textContent = chk.print_date;

    const sales = mockSales.filter(s => s.check_number === checkNumber);
    const tbody = document.getElementById('v-check-products');
    
    tbody.innerHTML = sales.map(sale => {
        const storeProd = mockStoreProducts.find(sp => sp.upc === sale.UPC);
        let productName = "Невідомий товар";
        if (storeProd) {
            const prod = mockProducts.find(p => p.id === storeProd.id_product);
            if (prod) productName = prod.name;
        }

        const rowTotal = sale.product_number * sale.selling_price;
        return `
            <tr>
                <td class="fw-semibold">${productName} <br><span class="text-muted small">UPC: ${sale.UPC}</span></td>
                <td>${sale.product_number} шт.</td>
                <td>${sale.selling_price.toFixed(2)}</td>
                <td class="text-end fw-bold">${rowTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const cardEl = document.getElementById('v-check-card');
    if (chk.card_number) {
        const cust = mockCustomers.find(c => c.card_number === chk.card_number);
        const percent = cust ? cust.percent : 0;
        cardEl.textContent = `Картка: ${chk.card_number} (Знижка ${percent}%)`;
        cardEl.style.display = 'inline-block';
    } else {
        cardEl.style.display = 'none';
    }

    document.getElementById('v-check-vat').textContent = chk.vat.toFixed(2);
    document.getElementById('v-check-total').textContent = chk.sum_total.toFixed(2);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCheckModal')).show();
}

function viewEmployeeDetails(id) {
    const empl = mockEmployees.find(e => e.id === id);
    if (!empl) return;

    const header = document.getElementById('v-header');
    
    if (header) {
        header.classList.remove('badge-manager', 'badge-cashier');
        const closeBtn = header.querySelector('.btn-close');
        
        if (closeBtn) {
            closeBtn.classList.remove('btn-close-white');
        }

        if (empl.role === 'Менеджер') {
            header.classList.add('badge-manager');
            if (closeBtn) closeBtn.classList.add('btn-close-white');
        } else {
            header.classList.add('badge-cashier');
            if (closeBtn) closeBtn.classList.add('btn-close-white');
        }
    }

    document.getElementById('v-id').textContent = `Табельний номер: #${empl.id}`;
    document.getElementById('v-fullName').textContent = `${empl.surname} ${empl.name} ${empl.patronymic || ''}`;
    document.getElementById('v-phone').textContent = empl.phone;
    document.getElementById('v-salary').textContent = `${empl.salary} грн`;
    document.getElementById('v-birth').textContent = empl.birth_date;
    document.getElementById('v-start').textContent = empl.start_date;
    document.getElementById('v-address').textContent = `${empl.zip}, м. ${empl.city}, ${empl.street}`;
    
    const roleBadge = document.getElementById('v-role');
    roleBadge.textContent = empl.role;
    roleBadge.className = `badge-empl ${empl.role === 'Менеджер' ? 'badge-manager' : 'badge-cashier'}`;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('viewEmployeeModal'));
    modal.show();
}

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

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCustomerModal'));
    modal.show();
}

function resetStoreProductForm() {
    const form = document.getElementById('addStoreProductForm');
    if(form) form.reset();
    
    document.querySelector('#addStoreProductModal .modal-title').textContent = "Товар на полиці";
    document.getElementById('isEditMode').value = "false";

    const alertMessage = document.getElementById('spAlertMessage');
    if (alertMessage) alertMessage.textContent = '';
    
    const upcInput = document.getElementById('spUpcInput');
    if (upcInput) {
        upcInput.readOnly = false;
        upcInput.classList.remove('bg-light');
    }

    const promoText = document.getElementById('promoStatusText');
    if(promoText) promoText.textContent = "Ні";
}

function sortTableData(dataArray, key, type, renderFunction) {
    if (currentSortColumn === key) {
        isAscending = !isAscending;
    } else {
        currentSortColumn = key;
        isAscending = true;
    }

    dataArray.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (type === 'string') {
            valA = valA ? valA.toString().toLowerCase() : '';
            valB = valB ? valB.toString().toLowerCase() : '';
            
            if (valA < valB) return isAscending ? -1 : 1;
            if (valA > valB) return isAscending ? 1 : -1;
            return 0;
        } 
        else if (type === 'number') {
            return isAscending ? valA - valB : valB - valA;
        }
    });

    renderFunction(dataArray);
}

function calculatePosTotals() {
    const subtotal = currentReceipt.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (appliedCustomer) {
        discount = subtotal * (appliedCustomer.percent / 100);
    }

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
    if (currentReceipt[index].quantity <= 0) {
        currentReceipt.splice(index, 1);
    }
    renderPosTable();
    calculatePosTotals();
};

window.removeFromReceipt = (index) => {
    currentReceipt.splice(index, 1);
    renderPosTable();
    calculatePosTotals();
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

    if (pageType === 'products') {
        const container = document.getElementById('filterCategoryList');
        if (container) {
            container.innerHTML = mockCategories.map(cat => `
                <div class="form-check mb-1">
                    <input class="form-check-input zlagoda-checkbox" type="checkbox" value="${cat.category_number}" id="catCheck${cat.category_number}" checked>
                    <label class="form-check-label small" for="catCheck${cat.category_number}">${cat.category_name}</label>
                </div>
            `).join('');
        }
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
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('filterModal')).show();
};

window.changeFilterPercent = (delta) => {
    const input = document.getElementById('filterPercent');
    let val = (parseInt(input.value) || 0) + delta;
    input.value = Math.max(0, Math.min(100, val));
};