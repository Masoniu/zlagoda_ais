let itemToDeleteId = null;
let itemToDeleteType = null;
let currentReceipt = [];
let appliedCustomer = null;

let mockCategories = [];
let mockProducts = [];
let mockStoreProducts = [];
let mockEmployees = [];
let mockCustomers = [];
let mockChecks = [];

let currentSort = {
    categories: { order: 'asc' },
    products: { order: 'asc' },
    storeProducts: { by: 'name', order: 'asc' },
    customers: { order: 'asc' },
    employees: { order: 'asc' }
};

let savedFilters = {
    'employees': { manager: true, cashier: true },
    'customers': { percent: 0 },
    'products': { categories: null },
    'store-products': { promo: 'all' },
    'checks': { cashier: 'all', start: '', end: '' }
};

const API_BASE_URL = 'http://127.0.0.1:8000';

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

async function apiFetch(endpoint) {
    const token = sessionStorage.getItem('token');
    if (!token) return [];

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            sessionStorage.clear();
            showBeautifulAlert('Сеанс закінчився. Будь ласка, увійдіть знову', 'warning');
            setTimeout(() => {
                window.location.href = '../shared/login.html';
            }, 1500);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error(error);
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
            showBeautifulAlert('Сеанс закінчився. Будь ласка, увійдіть знову', 'warning');
            setTimeout(() => {
                window.location.href = '../shared/login.html';
            }, 1500);
            return { success: false };
        }

        if (!response.ok) {
            let errorMessage = 'Помилка сервера';
            try {
                const err = await response.json();
                errorMessage = err.detail || err.message || errorMessage;
            } catch (e) {
                errorMessage = `Помилка сервера (${response.status})`;
            }
            throw new Error(errorMessage);
        }

        if (method === 'DELETE' || response.status === 204) {
            return { success: true };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        console.error(error);
        showBeautifulAlert(error.message, 'danger');
        return { success: false, error: error.message };
    }
}

async function fetchAndDisplayTotalSum(queryString = '') {
    const data = await apiFetch(`/checks/analytics/total-sum${queryString}`);
    const sumElement = document.getElementById('totalChecksSum');
    if (sumElement && data) {
        sumElement.textContent = parseFloat(data.total_sum).toFixed(2);
    }
}