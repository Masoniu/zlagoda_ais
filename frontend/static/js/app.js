//data
let itemToDeleteId = null;
let itemToDeleteType = null;

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

const mockEmployees = [
    { 
        id: 12345, password: "123", surname: "Мельник", name: "Анна", patronymic: "Олексіївна",
        role: "Менеджер", salary: 35000, start_date: "2023-01-10", birth_date: "1990-05-14",
        phone: "+380951234567", city: "Київ", street: "вул. Хрещатик 15", zip: "02100"
    }
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
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn_edit me-2">Редагувати</button>
                    <button class="btn btn-sm btn_delete">Видалити</button>
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
            <td class="fw-bold">${empl.salary} грн</td>
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

function populateCategoryDropdown() {
    const select = document.getElementById('categorySelectInput');
    if (!select) return;
    select.innerHTML = '<option value="" selected disabled>Оберіть категорію...</option>';
    mockCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.category_number}">${cat.category_name}</option>`;
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
                alertMessage.style.color = 'var(--primary-color)';
                alertMessage.textContent = `Вітаємо, ${initials}!`;
                setTimeout(() => {
                    window.location.href = '../manager/home.html';
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

document.addEventListener('DOMContentLoaded', () => {
    displayUserName();
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

   const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
            logoutModal.show();
        });
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
            }

            const modalEl = document.getElementById('deleteConfirmModal');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        };
    }

    if (document.getElementById('employeeTableBody')) {
        renderEmployees(mockEmployees);
        setupSearch('employeeSearch', mockEmployees, renderEmployees, 'surname');
        setupEmployeeForm();
    }

    const roleBtns = document.querySelectorAll('.btn-role-select');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('emplRoleInput').value = btn.dataset.role;
        });
    });
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
        const editIdEl = document.getElementById('editProductId');
        const nameEl = document.getElementById('productNameInput');
        const manufEl = document.getElementById('productManufacturerInput');
        const charsEl = document.getElementById('productCharsInput');
        const catSelectEl = document.getElementById('categorySelectInput');
        const editId = editIdEl ? editIdEl.value : "";
        const productData = {
            id: editId ? parseInt(editId) : Math.floor(Math.random() * 1000),
            name: nameEl.value,
            manufacturer: manufEl ? manufEl.value : "",
            chars: charsEl.value,
            category_id: parseInt(catSelectEl.value)
        };
        if (editId) {
            const index = mockProducts.findIndex(p => p.id === parseInt(editId));
            if (index !== -1) mockProducts[index] = productData;
        } else {
            mockProducts.push(productData);
        }

        renderProducts(mockProducts);
        
        const modalEl = document.getElementById('addProductModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
        
        form.reset();
        if (editIdEl) editIdEl.value = "";
    });
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

function deleteEmployee(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'employee';
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