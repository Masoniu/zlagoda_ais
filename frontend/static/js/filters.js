window.loadCategories = async (query = '') => {
    let url = `/categories/?sort_order=${currentSort.categories.order}`;
    if (query) url += `&category_name=${encodeURIComponent(query)}`;
    mockCategories = await apiFetch(url);
    if (document.getElementById('categoryTableBody')) renderCategories(mockCategories);
};

window.loadProducts = async (query = '') => {
    if (savedFilters.products.categories !== null && savedFilters.products.categories.length === 0) {
        mockProducts = [];
        if (document.getElementById('productTableBody')) {
            renderProducts(mockProducts);
        }
        return;
    }
    const params = new URLSearchParams();
    params.append('sort_order', currentSort.products.order);
    if (query) params.append('name', query);
    if (savedFilters.products.categories !== null) {
        savedFilters.products.categories.forEach(id => params.append('category_number', id));
    }
    const dbProducts = await apiFetch(`/products/?${params.toString()}`);
    mockProducts = dbProducts.map(p => ({
        id: p.id_product, name: p.product_name, manufacturer: p.manufacturer,
        chars: p.characteristics, category_id: p.category_number, category_name: p.category_name
    }));
    if (document.getElementById('productTableBody')) {
        renderProducts(mockProducts);
        populateCategoryDropdown();
    }
};

window.loadStoreProducts = async (query = '') => {
    let url = `/store-products/?sort_by=${currentSort.storeProducts.by}&sort_order=${currentSort.storeProducts.order}`;
    if (query) url += `&upc=${encodeURIComponent(query)}`;
    const dbStoreProducts = await apiFetch(url);
    mockStoreProducts = dbStoreProducts.map(sp => ({
        upc: sp.UPC,
        id_product: sp.id_product,
        selling_price: parseFloat(sp.selling_price),
        products_number: sp.products_number,
        promotional_product: sp.promotional_product,
        product_name: sp.product_name
    }));
    if (document.getElementById('storeProductTableBody')) {
        renderStoreProducts(mockStoreProducts);
        populateProductDropdown();
    }
};

window.loadCustomers = async (query = '') => {
    let url = `/customer-cards/?sort_order=${currentSort.customers.order}`;
    if (query) url += `&surname=${encodeURIComponent(query)}`;
    const dbCustomers = await apiFetch(url);
    mockCustomers = dbCustomers.map(c => ({
        card_number: c.card_number, surname: c.cust_surname, name: c.cust_name, patronymic: c.cust_patronymic,
        phone: c.phone_number, city: c.city, street: c.street, zip: c.zip_code, percent: c.percent
    }));
    if (document.getElementById('customerTableBody')) renderCustomers(mockCustomers);
};

window.loadEmployees = async (query = '') => {
    if (sessionStorage.getItem('userRole') !== 'Менеджер') {
        const me = await apiFetch('/employees/me');
        if (me && me.id_employee) {
            mockEmployees = [me].map(e => ({
                id: e.id_employee, surname: e.empl_surname, name: e.empl_name, patronymic: e.empl_patronymic,
                role: e.empl_role, salary: e.salary, start_date: e.date_of_start, birth_date: e.date_of_birth,
                phone: e.phone_number, city: e.city, street: e.street, zip: e.zip_code
            }));
            if (document.getElementById('employeeTableBody')) renderEmployees(mockEmployees);
        }
        return;
    }

    const params = new URLSearchParams();
    params.append('sort_order', currentSort.employees.order);
    if (query) params.append('surname', query);
    if (savedFilters.employees.manager) params.append('role', 'Менеджер');
    if (savedFilters.employees.cashier) params.append('role', 'Касир');
    const dbEmployees = await apiFetch(`/employees/?${params.toString()}`);

    if (Array.isArray(dbEmployees)) {
        mockEmployees = dbEmployees.map(e => ({
            id: e.id_employee, surname: e.empl_surname, name: e.empl_name, patronymic: e.empl_patronymic,
            role: e.empl_role, salary: e.salary, start_date: e.date_of_start, birth_date: e.date_of_birth,
            phone: e.phone_number, city: e.city, street: e.street, zip: e.zip_code
        }));
        if (document.getElementById('employeeTableBody')) renderEmployees(mockEmployees);
    }
};

window.loadChecks = async (query = '') => {
    const url = query ? `/checks/?check_number=${encodeURIComponent(query)}` : '/checks/';
    const dbChecks = await apiFetch(url);
    mockChecks = dbChecks.map(c => ({
        check_number: c.check_number, id_employee: c.id_employee, card_number: c.card_number,
        print_date: new Date(c.print_date).toLocaleString('uk-UA'), sum_total: parseFloat(c.sum_total), vat: parseFloat(c.vat), cashier_name: c.cashier_name
    }));
    if (document.getElementById('checkTableBody')) {
        renderChecks(mockChecks);
        await fetchAndDisplayTotalSum();
    }
};

window.handleSort = (entity, column = null) => {
    currentSort[entity].order = currentSort[entity].order === 'asc' ? 'desc' : 'asc';
    if (column) currentSort[entity].by = column;
    let query = '';
    if (entity === 'categories') { query = document.getElementById('categorySearch')?.value || ''; loadCategories(query); }
    else if (entity === 'products') { query = document.getElementById('productSearch')?.value || ''; loadProducts(query); }
    else if (entity === 'storeProducts') { query = document.getElementById('storeProductSearch')?.value || ''; loadStoreProducts(query); }
    else if (entity === 'customers') { query = document.getElementById('customerSearch')?.value || ''; loadCustomers(query); }
    else if (entity === 'employees') { query = document.getElementById('employeeSearch')?.value || ''; loadEmployees(query); }
};

window.applyFilters = async () => {
    const activeSection = document.querySelector('.filter-section[style*="display: block"]');
    if (!activeSection) return;
    const pageType = activeSection.id.replace('filter-', '');
    let endpoint = '';
    try {
        if (pageType === 'products') {
            const checkedCats = Array.from(document.querySelectorAll('#filterCategoryList input:checked')).map(cb => cb.value);
            savedFilters['products'].categories = checkedCats;
            const currentSearch = document.getElementById('productSearch')?.value.trim() || '';
            await loadProducts(currentSearch);
        } else if (pageType === 'customers') {
            const percentVal = document.getElementById('filterPercent').value;
            savedFilters['customers'].percent = percentVal;
            endpoint = (!percentVal || percentVal === "0") ? '/customer-cards/' : `/customer-cards/?percent=${percentVal}`;
            const dbCustomers = await apiFetch(endpoint);
            mockCustomers = dbCustomers.map(c => ({
                card_number: c.card_number, surname: c.cust_surname, name: c.cust_name, patronymic: c.cust_patronymic,
                phone: c.phone_number, city: c.city, street: c.street, zip: c.zip_code, percent: c.percent
            }));
            renderCustomers(mockCustomers);
        } else if (pageType === 'employees') {
            const isManager = document.getElementById('fRoleManager').checked;
            const isCashier = document.getElementById('fRoleCashier').checked;
            savedFilters['employees'].manager = isManager;
            savedFilters['employees'].cashier = isCashier;
            if (!isManager && !isCashier) {
                mockEmployees = [];
                renderEmployees(mockEmployees);
                bootstrap.Modal.getOrCreateInstance(document.getElementById('filterModal')).hide();
                return;
            }
            const currentSearch = document.getElementById('employeeSearch')?.value.trim() || '';
            await loadEmployees(currentSearch);
        } else if (pageType === 'store-products') {
            const promoVal = document.getElementById('filterPromoSelect').value;
            savedFilters['store-products'].promo = promoVal;
            endpoint = `/store-products/?sort_by=name`;
            if (promoVal !== 'all') {
                endpoint += `&promotional=${promoVal === 'yes' ? 'true' : 'false'}`;
            }
            const dbStoreProducts = await apiFetch(endpoint);
            mockStoreProducts = dbStoreProducts.map(sp => ({
                upc: sp.upc || sp.UPC, id_product: sp.id_product, selling_price: parseFloat(sp.selling_price),
                products_number: sp.products_number, promotional_product: sp.promotional_product,
                product_name: sp.product_name
            }));
            renderStoreProducts(mockStoreProducts);
        } else if (pageType === 'checks') {
            const cashierVal = document.getElementById('filterCheckCashier').value;
            const startVal = document.getElementById('filterCheckStart').value;
            const endVal = document.getElementById('filterCheckEnd').value;
            savedFilters['checks'].cashier = cashierVal;
            savedFilters['checks'].start = startVal;
            savedFilters['checks'].end = endVal;
            const params = new URLSearchParams();
            if (cashierVal !== 'all') params.append('id_employee', cashierVal);
            if (startVal) params.append('start_date', startVal);
            if (endVal) params.append('end_date', endVal);
            endpoint = `/checks/${params.toString() ? '?' + params.toString() : ''}`;
            const dbChecks = await apiFetch(endpoint);
            mockChecks = dbChecks.map(c => ({
                check_number: c.check_number, id_employee: c.id_employee, card_number: c.card_number,
                print_date: new Date(c.print_date).toLocaleString('uk-UA'),
                sum_total: parseFloat(c.sum_total), vat: parseFloat(c.vat),
                cashier_name: c.cashier_name
            }));
            renderChecks(mockChecks);
            await fetchAndDisplayTotalSum(params.toString() ? '?' + params.toString() : '');
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById('filterModal')).hide();
        showBeautifulAlert('Фільтри застосовано!', 'success');
    } catch (error) {
        console.error(error);
        showBeautifulAlert('Помилка фільтрації', 'danger');
    }
};

window.openFilterModal = async (pageType) => {
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
            try {
                const cashiers = await apiFetch('/employees/?role=Касир');
                cashiers.forEach(c => {
                    const opt = new Option(`${c.empl_surname} ${c.empl_name[0]}.`, c.id_employee);
                    select.add(opt);
                });
            } catch (error) {
                console.error("Не вдалося завантажити список касирів для фільтра", error);
            }
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