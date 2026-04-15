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
        
        const alertMessage = document.getElementById('alertMessage');
        const submitBtn = document.querySelector('button[type="submit"]');

        const VALID_USER = { login: "Anna", password: "123" };
        const enteredLogin = document.getElementById('loginInput').value;
        const enteredPassword = document.getElementById('passwordInput').value;

        alertMessage.textContent = '';
        alertMessage.classList.remove('mt-3'); 
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        setTimeout(() => {
            alertMessage.classList.add('mt-3');

            if (enteredLogin === VALID_USER.login && enteredPassword === VALID_USER.password) {
                alertMessage.style.color = 'var(--primary-color)';
                alertMessage.textContent = 'Вітаємо, ' + enteredLogin + '.';
                sessionStorage.setItem('userName', enteredLogin);

                setTimeout(() => {
                    window.location.href = '../manager/home.html';
                }, 1000);
            } else {
                alertMessage.style.color = 'red';
                alertMessage.textContent = 'Невірний логін або пароль';
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
            }
        
            const modalEl = document.getElementById('deleteConfirmModal');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        };
    }
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