function setupCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editCategoryId').value;
        const categoryName = document.getElementById('categoryNameInput').value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!categoryName) {
            showBeautifulAlert('Будь ласка, введіть назву категорії', 'warning');
            return;
        }
        const data = { category_name: categoryName };
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
        const productName = document.getElementById('productNameInput').value.trim();
        const characteristics = document.getElementById('productCharsInput').value.trim();
        const categoryId = document.getElementById('categorySelectInput').value;
        if (!productName) {
            showBeautifulAlert('Будь ласка, введіть назву товару', 'warning');
            return;
        }
        if (!characteristics) {
            showBeautifulAlert('Будь ласка, введіть характеристики товару', 'warning');
            return;
        }
        if (!categoryId) {
            showBeautifulAlert('Будь ласка, виберіть категорію', 'warning');
            return;
        }
        const data = {
            product_name: productName,
            manufacturer: document.getElementById('productManufacturerInput').value.trim(),
            characteristics: characteristics,
            category_number: parseInt(categoryId)
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

function resetStoreProductForm() {
    const form = document.getElementById('addStoreProductForm');
    if (form) form.reset();
    document.getElementById('isEditMode').value = "false";
    document.getElementById('spUpcInput').disabled = false;
    const promoSwitch = document.getElementById('spPromoInput');
    const priceInput = document.getElementById('spPriceInput');
    const promoText = document.getElementById('promoStatusText');
    if (promoSwitch) promoSwitch.checked = false;
    if (priceInput) {
        priceInput.disabled = false;
        priceInput.placeholder = "";
        priceInput.value = "";
    }
    if (promoText) promoText.textContent = "Ні";
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
        if (!upcInput) {
            showBeautifulAlert('Будь ласка, введіть UPC', 'warning');
            return;
        }
        if (!document.getElementById('spProductSelect').value) {
            showBeautifulAlert('Будь ласка, виберіть товар', 'warning');
            return;
        }
        if (!document.getElementById('spQuantityInput').value) {
            showBeautifulAlert('Будь ласка, введіть кількість', 'warning');
            return;
        }
        const data = {
            UPC: upcInput,
            id_product: parseInt(document.getElementById('spProductSelect').value),
            selling_price: parseFloat(document.getElementById('spPriceInput').value) || 0,
            products_number: parseInt(document.getElementById('spQuantityInput').value),
            promotional_product: document.getElementById('spPromoInput').checked
        };
        if (data.promotional_product) {
            const upcPromInput = document.getElementById('spUpcPromInput');
            if (upcPromInput && upcPromInput.value.trim()) {
                data.upc_prom = upcPromInput.value.trim();
            } else {
                showBeautifulAlert('Для акційного товару потрібно вказати базовий UPC', 'warning');
                return;
            }
        } else {
            data.upc_prom = null;
        }
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
        if (!document.getElementById('emplSurnameInput').value.trim()) {
            showBeautifulAlert('Будь ласка, введіть прізвище', 'warning');
            return;
        }
        if (!document.getElementById('emplNameInput').value.trim()) {
            showBeautifulAlert('Будь ласка, введіть ім\'я', 'warning');
            return;
        }
        if (!editId && !document.getElementById('emplPasswordInput').value) {
            showBeautifulAlert('Будь ласка, введіть пароль', 'warning');
            return;
        }
        const data = {
            empl_surname: document.getElementById('emplSurnameInput').value.trim(),
            empl_name: document.getElementById('emplNameInput').value.trim(),
            empl_patronymic: document.getElementById('emplPatronymicInput').value.trim(),
            empl_role: document.getElementById('emplRoleInput').value,
            salary: parseFloat(document.getElementById('emplSalaryInput').value),
            date_of_start: document.getElementById('emplStartInput').value,
            date_of_birth: document.getElementById('emplBirthInput').value,
            phone_number: document.getElementById('emplPhoneInput').value.trim(),
            city: document.getElementById('emplCityInput').value.trim(),
            street: document.getElementById('emplStreetInput').value.trim(),
            zip_code: document.getElementById('emplZipInput').value.trim()
        };
        const passVal = document.getElementById('emplPasswordInput').value;
        if (passVal) data.password = passVal;
        submitBtn.disabled = true;
        let res;
        if (editId) {
            res = await apiMutate(`/employees/${editId}`, 'PUT', data);
        } else {
            data.password = document.getElementById('emplPasswordInput').value;
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
        const surname = document.getElementById('custSurnameInput').value.trim();
        const name = document.getElementById('custNameInput').value.trim();
        const phone = document.getElementById('custPhoneInput').value.trim();
        const percent = document.getElementById('custPercentInput').value;
        if (!surname || !name || !phone) {
            showBeautifulAlert('Будь ласка, заповніть обов\'язкові поля (Прізвище, Ім\'я, Телефон)', 'warning');
            return;
        }
        const data = {
            cust_surname: surname,
            cust_name: name,
            cust_patronymic: document.getElementById('custPatronymicInput').value.trim(),
            phone_number: phone,
            percent: parseInt(percent) || 0,
            city: document.getElementById('custCityInput').value.trim(),
            street: document.getElementById('custStreetInput').value.trim(),
            zip_code: document.getElementById('custZipInput').value.trim()
        };
        submitBtn.disabled = true;
        let res;
        if (editId) {
            res = await apiMutate(`/customer-cards/${editId}`, 'PUT', data);
        } else {
            res = await apiMutate('/customer-cards/', 'POST', data);
        }
        submitBtn.disabled = false;
        if (res.success) {
            await loadRealDataFromDB();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('addCustomerModal')).hide();
            showBeautifulAlert('Дані клієнта успішно збережено!', 'success');
        }
    });
}

function deleteCategory(id) { itemToDeleteId = id; itemToDeleteType = 'category'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteProduct(id) { itemToDeleteId = id; itemToDeleteType = 'product'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteStoreProduct(upc) { itemToDeleteId = upc; itemToDeleteType = 'store_product'; bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show(); }
function deleteCheck(checkNumber) {
    itemToDeleteId = checkNumber;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteCheckConfirmModal')).show();
}
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
    document.getElementById('emplPasswordInput').value = "";
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

window.viewCheckDetails = async (checkNumber) => {
    const chk = mockChecks.find(c => c.check_number === checkNumber);
    if (!chk) return;
    document.getElementById('v-check-id').textContent = `Чек #${chk.check_number}`;
    document.getElementById('v-check-cashier').textContent = chk.cashier_name || "Невідомий";
    document.getElementById('v-check-date').textContent = chk.print_date;
    apiFetch(`/checks/${checkNumber}/details`).then(data => {
        const tbody = document.getElementById('v-check-products');
        if(data && data.items) {
            tbody.innerHTML = data.items.map(sale => `
                <tr>
                    <td class="fw-semibold">${sale.product_name} <br><span class="text-muted small">UPC: ${sale.upc}</span></td>
                    <td>${sale.quantity} шт.</td>
                    <td>${sale.selling_price.toFixed(2)} грн</td>
                    <td class="text-end fw-bold">${(sale.quantity * sale.selling_price).toFixed(2)} грн</td>
                </tr>
            `).join('');
        }
    });
    const cardEl = document.getElementById('v-check-card');
    if (chk.card_number) {
        if (mockCustomers.length === 0) {
            await window.loadCustomers();
        }
        const cust = mockCustomers.find(c => c.card_number === chk.card_number);
        cardEl.textContent = `Картка: ${chk.card_number} (Знижка ${cust ? cust.percent : 0}%)`;
        cardEl.style.display = 'inline-block';
    } else {
        cardEl.style.display = 'none';
    }
    document.getElementById('v-check-vat').textContent = chk.vat.toFixed(2);
    document.getElementById('v-check-total').textContent = chk.sum_total.toFixed(2);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCheckModal')).show();
};

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
    document.getElementById('v-salary').textContent = `${parseFloat(empl.salary).toFixed(2)} грн`;
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

async function loadRealDataFromDB() {
    const isPosPage = document.getElementById('posScanForm') !== null;
    if (document.getElementById('categoryTableBody') || document.getElementById('productTableBody')) {
        await loadCategories();
        const searchInput = document.getElementById('categorySearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadCategories(e.target.value.trim())));
    }
    if (document.getElementById('productTableBody') || document.getElementById('storeProductTableBody') || isPosPage) {
        await loadProducts();
        const searchInput = document.getElementById('productSearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadProducts(e.target.value.trim())));
    }
    if (document.getElementById('storeProductTableBody') || isPosPage) {
        await loadStoreProducts();
        const searchInput = document.getElementById('storeProductSearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadStoreProducts(e.target.value.trim())));
    }
    if (document.getElementById('customerTableBody') || isPosPage) {
        await loadCustomers();
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadCustomers(e.target.value.trim())));
    }
    if (document.getElementById('employeeTableBody') || document.getElementById('checkTableBody')) {
        await loadEmployees();
        const searchInput = document.getElementById('employeeSearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadEmployees(e.target.value.trim())));
    }
    if (document.getElementById('checkTableBody')) {
        await loadChecks();
        const searchInput = document.getElementById('checkSearch');
        if (searchInput) searchInput.addEventListener('input', debounce((e) => loadChecks(e.target.value.trim())));
    }
    populatePosDatalists();
}

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

document.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.login_page')) {
        document.body.classList.add('loaded');
        return;
    }
    const role = sessionStorage.getItem('userRole');
    if (role === 'Касир') {
        document.body.classList.add('cashier-mode');
    }
    const modalsPlaceholder = document.getElementById('modals_placeholder');
    if (modalsPlaceholder) {
        try {
            const res = await fetch('../shared/modals.html');
            modalsPlaceholder.innerHTML = await res.text();
            if (typeof flatpickr !== 'undefined') {
    flatpickr("#filterCheckStart, #filterCheckEnd, #analyticsStartDate, #analyticsEndDate", {
        enableTime: true,
        dateFormat: "Y-m-dTH:i",
        altInput: true,
        altFormat: "d.m.Y H:i",
        time_24hr: true,
        locale: "uk"
    });
    flatpickr("#emplBirthInput, #emplStartInput", {
        enableTime: false,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d.m.Y",
        locale: "uk",
        maxDate: "today"
    });
}
        } catch (error) { console.error(error); }
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
        } catch (error) { console.error(error); }
    }
    updateGreeting();
    await loadRealDataFromDB();
    setupCategoryForm();
    setupProductForm();
    setupStoreProductForm();
    setupEmployeeForm();
    setupCustomerForm();
    const confirmLogout = document.getElementById('confirmLogout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '../shared/login.html';
        });
    }
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
                btnConfirmDelete.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
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
        const btnDeleteOnly = document.getElementById('btnDeleteOnly');
        const btnDeleteAndReturn = document.getElementById('btnDeleteAndReturn');
        const executeCheckDeletion = async (returnItems) => {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteCheckConfirmModal'));
            const originalText1 = btnDeleteOnly.innerHTML;
            const originalText2 = btnDeleteAndReturn.innerHTML;
            btnDeleteOnly.disabled = true;
            btnDeleteAndReturn.disabled = true;
            if (returnItems) btnDeleteAndReturn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            else btnDeleteOnly.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            const res = await apiMutate(`/checks/${itemToDeleteId}?return_items=${returnItems}`, 'DELETE');
            btnDeleteOnly.disabled = false;
            btnDeleteAndReturn.disabled = false;
            btnDeleteOnly.innerHTML = originalText1;
            btnDeleteAndReturn.innerHTML = originalText2;
            if (res.success) {
                modalInstance.hide();
                await loadRealDataFromDB();
                showBeautifulAlert('Чек успішно видалено!', 'success');
            }
        };
        if (btnDeleteOnly) btnDeleteOnly.onclick = () => executeCheckDeletion(false);
        if (btnDeleteAndReturn) btnDeleteAndReturn.onclick = () => executeCheckDeletion(true);
    }
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
    const posForm = document.getElementById('posScanForm');
    const posInput = document.getElementById('posUpcInput');
    if (posForm) {
        posForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputValue = posInput.value.trim();
            if (!inputValue) return;
            const storeProduct = await apiFetch(`/store-products/${inputValue}`);
            if (storeProduct && storeProduct.product_name) {
                if (storeProduct.products_number <= 0) {
                    showBeautifulAlert("Цього товару немає в наявності!", 'danger');
                    return;
                }
                const existingItem = currentReceipt.find(item => item.upc === inputValue);
                if (existingItem) {
                    if (existingItem.quantity >= storeProduct.products_number) {
                        showBeautifulAlert(`На полиці залишилось лише ${storeProduct.products_number} шт.`, 'danger');
                        return;
                    }
                    existingItem.quantity += 1;
                } else {
                    currentReceipt.push({
                        upc: inputValue,
                        name: storeProduct.product_name,
                        price: parseFloat(storeProduct.selling_price),
                        quantity: 1,
                        max_quantity: storeProduct.products_number
                    });
                }
                renderPosTable();
                calculatePosTotals();
                posInput.value = '';
            } else {
                showBeautifulAlert("Товар з таким UPC не знайдено!", 'danger');
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
        const posPayBtn = document.getElementById('posPayBtn');
        if (posPayBtn) {
            posPayBtn.addEventListener('click', async () => {
                if (currentReceipt.length === 0) return;
                posPayBtn.disabled = true;
                posPayBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Обробка...';
                const payload = {
                    card_number: appliedCustomer ? appliedCustomer.card_number : null,
                    items: currentReceipt.map(item => ({
                        UPC: item.upc,
                        product_number: item.quantity
                    }))
                };
                const res = await apiMutate('/checks/', 'POST', payload);
                posPayBtn.disabled = false;
                posPayBtn.innerHTML = '<i class="bi bi-cash-coin me-2"></i> ОПЛАТИТИ';
                if (res.success) {
                    showBeautifulAlert('Чек успішно збережено!', 'success');
                    currentReceipt = [];
                    appliedCustomer = null;
                    document.getElementById('posCardInput').value = '';
                    document.getElementById('posCardResult').textContent = '';
                    renderPosTable();
                    calculatePosTotals();
                    await loadStoreProducts();
                }
            });
        }
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
    if(typeof flatpickr !== 'undefined') {
        flatpickr("#reportStartDate, #reportEndDate", { enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true, locale: "uk" });
    }
    const btnCatReport = document.getElementById('btnGenerateCatReport');
    if (btnCatReport) {
        btnCatReport.addEventListener('click', async () => {
            const start = document.getElementById('reportStartDate').value;
            const end = document.getElementById('reportEndDate').value;
            if(!start || !end) return showBeautifulAlert('Оберіть обидві дати', 'warning');

            const data = await apiFetch(`/checks/reports/category-revenue?start_date=${start}:00&end_date=${end}:00`);

            if(data.length === 0) {
                document.getElementById('catReportBody').innerHTML = '<tr><td colspan="3" class="text-center text-muted">За цей період продажів не знайдено</td></tr>';
                return;
            }

            document.getElementById('catReportBody').innerHTML = data.map(r => `
                <tr>
                    <td class="fw-semibold">${r.category_name}</td>
                    <td>${r.total_sold} шт.</td>
                    <td class="text-end fw-bold text-success">${parseFloat(r.total_revenue).toFixed(2)} грн</td>
                </tr>
            `).join('');
        });
    }
    const btnTopPromo = document.getElementById('btnTopPromoCustomers');
    if (btnTopPromo) {
        btnTopPromo.addEventListener('click', async () => {
            btnTopPromo.disabled = true;
            const data = await apiFetch('/customer-cards/reports/all-promo');
            btnTopPromo.disabled = false;

            if(data.length === 0) {
                showBeautifulAlert('Немає клієнтів, які купили всі акційні товари', 'warning');
                return;
            }

            const mappedData = data.map(c => ({
                card_number: c.card_number, surname: c.cust_surname, name: c.cust_name, patronymic: c.cust_patronymic,
                phone: c.phone_number, city: c.city, street: c.street, zip: c.zip_code, percent: c.percent
            }));

            renderCustomers(mappedData);
            showBeautifulAlert('Фільтр застосовано: клієнти, що купили всі акції', 'success');
        });
    }

    const viewCustomerModal = document.getElementById('viewCustomerModal');
    if (viewCustomerModal) {
        viewCustomerModal.addEventListener('hidden.bs.modal', () => {
            const listEl = document.getElementById('v-cust-history-list');
            if (listEl) {
                listEl.innerHTML = '';
            }
        });
    }

    const btnCustHistory = document.getElementById('btnCustHistory');
    if (btnCustHistory) {
        btnCustHistory.addEventListener('click', async () => {
            const cardNumText = document.getElementById('v-cust-id').textContent;
            const cardNum = cardNumText.replace('Номер карти: ', '').replace('ID: ', '').trim();

            const listEl = document.getElementById('v-cust-history-list');
            listEl.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm text-zlagoda"></div></div>';

            try {
                const data = await apiFetch(`/customer-cards/${cardNum}/reports/history`);

                if(data.length === 0) {
                    listEl.innerHTML = '<div class="text-muted text-center py-2">Клієнт ще нічого не купував</div>';
                    return;
                }

                listEl.innerHTML = data.map(item => `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-2 px-1">
                        <span class="fw-semibold text-dark">${item.product_name}</span>
                        <span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill">
                            ${item.total_quantity} шт.
                        </span>
                    </div>
                `).join('');
            } catch (error) {
                listEl.innerHTML = '<div class="text-danger small">Помилка завантаження</div>';
            }
        });
    }

    const btnBestsellers = document.getElementById('btnBestsellers');
    if (btnBestsellers) {
        btnBestsellers.addEventListener('click', async () => {
            try {
                const dbProducts = await apiFetch('/products/reports/bestsellers');
                if(dbProducts.length === 0) {
                    return showBeautifulAlert('Немає товарів, які продавав абсолютно кожен касир', 'warning');
                }
                const mapped = dbProducts.map(p => ({
                    id: p.id_product, 
                    name: p.product_name, 
                    manufacturer: p.manufacturer,
                    chars: p.characteristics, 
                    category_id: p.category_number, 
                    category_name: p.category_name
                }));
                renderProducts(mapped);
                showBeautifulAlert('Показано абсолютні бестселери!', 'success');
                
            } catch (error) {
                console.error("Помилка завантаження бестселерів:", error);
            }
        });
    }

    const perfModalEl = document.getElementById('cashierPerfModal');
    if (perfModalEl) {
        perfModalEl.addEventListener('show.bs.modal', async () => {
            document.getElementById('perfReportBody').innerHTML = '<tr><td colspan="3" class="text-center">Завантаження...</td></tr>';
            try {
                const data = await apiFetch('/employees/reports/performance');
                document.getElementById('perfReportBody').innerHTML = data.map(r => `
                    <tr>
                        <td class="ps-4 fw-semibold">${r.empl_surname} ${r.empl_name[0]}.</td>
                        <td><span class="badge bg-light text-dark border p-2 fs-6 fw-normal">${r.total_items_sold} шт.</span></td>
                        <td class="fw-bold">${parseFloat(r.total_revenue).toFixed(2)} грн</td>
                    </tr>
                `).join('');
            } catch (e) {
                document.getElementById('perfReportBody').innerHTML = '<tr><td colspan="3" class="text-center text-danger">Помилка завантаження</td></tr>';
            }
        });
    }

    const modalBtnBrandSearch = document.getElementById('modalBtnBrandSearch');
    if (modalBtnBrandSearch) {
        modalBtnBrandSearch.addEventListener('click', async () => {
            const brand = document.getElementById('modalBrandInput').value.trim();
            const tbody = document.getElementById('brandExpertsReportBody');

            if(!brand) {
                showBeautifulAlert('Будь ласка, введіть назву бренду', 'warning');
                return;
            }

            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3"><span class="spinner-border spinner-border-sm text-success"></span> Шукаємо...</td></tr>';

            try {
                const dbEmployees = await apiFetch(`/employees/reports/sold-all-brand?brand=${encodeURIComponent(brand)}`);

                if(dbEmployees.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Жоден касир не продав усі товари бренду <b>${brand}</b></td></tr>`;
                    return;
                }

                tbody.innerHTML = dbEmployees.map(e => `
                    <tr>
                        <td class="text-muted small ps-3">#${e.id_employee}</td>
                        <td class="fw-semibold">${e.empl_surname} ${e.empl_name[0]}.</td>
                        <td>${e.phone_number}</td>
                    </tr>
                `).join('');

            } catch (e) {
                console.error(e);
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-3">Помилка завантаження даних</td></tr>';
            }
        });
    }

    const brandExpertsModalEl = document.getElementById('brandExpertsModal');
    if (brandExpertsModalEl) {
        brandExpertsModalEl.addEventListener('hidden.bs.modal', () => {
            document.getElementById('modalBrandInput').value = '';
            document.getElementById('brandExpertsReportBody').innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Введіть бренд для пошуку експертів</td></tr>';
        });
    }
});