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
        const catName = prod.category_name || "Невідомо";
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
        const productName = sp.product_name || "Невідомий товар";
        const promoBadge = sp.promotional_product
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success p-2 fs-6">Так</span>'
            : '<span class="badge bg-light text-muted fw-normal p-2 fs-6">Ні</span>';
        return `
            <tr>
                <td class="ps-4 text-muted small">#${sp.upc}</td>
                <td class="fw-semibold">${productName}</td>
                <td>${sp.selling_price.toFixed(2)} грн</td>
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
    tableBody.innerHTML = data.map(chk => {
        const cashierName = chk.cashier_name || "Невідомий";
        return `
            <tr>
                <td class="ps-4">#${chk.check_number}</td>
                <td class="fw-semibold">${cashierName}</td>
                <td class="text-muted small">${chk.print_date}</td>
                <td>${chk.sum_total.toFixed(2)} грн</td>
                <td class="text-muted">${chk.vat.toFixed(2)} грн</td>
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
            <td>${parseFloat(empl.salary).toFixed(2)} грн</td>
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
            <td>${item.price.toFixed(2)} грн</td>
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
            <td class="fw-bold">${(item.price * item.quantity).toFixed(2)} грн</td>
            <td class="text-end pe-4">
                <button type="button" class="btn btn-delete-pos p-0 fs-5" onclick="removeFromReceipt(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function populatePosDatalists() {
    const upcList = document.getElementById('posUpcList');
    if (upcList) {
        upcList.innerHTML = '';
        mockStoreProducts.forEach(sp => {
            const name = sp.product_name || 'Невідомий товар';
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

window.generateReport = (pageTitle, tableBodyId) => {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const sourceTable = tbody.closest('table');
    const tableClone = sourceTable.cloneNode(true);
    const rows = tableClone.querySelectorAll('tr');

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

    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.className = 'table mb-0';

    const thead = tableClone.querySelector('thead');
    const firstRow = tableClone.querySelector('tr');
    const colCount = firstRow ? firstRow.children.length : 1;

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

    tableClone.querySelectorAll('th:not([colspan]), td:not([colspan])').forEach(cell => {
        cell.style.border = '1px solid black';
        cell.style.padding = '8px';
        cell.style.color = 'black';
        cell.style.backgroundColor = 'white';
    });

    let printStyle = document.getElementById('dynamicPrintStyle');
    if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = 'dynamicPrintStyle';
        document.head.appendChild(printStyle);
    }
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