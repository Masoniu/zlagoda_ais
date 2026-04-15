const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const alertMessage = document.getElementById('alertMessage');
        const submitBtn = document.querySelector('button[type="submit"]');

        const VALID_USER = {
            login: "Anna",
            password: "123"
        };

        const enteredLogin = document.getElementById('loginInput').value;
        const enteredPassword = document.getElementById('passwordInput').value;

        alertMessage.textContent = '';
        alertMessage.classList.remove('mt-3'); 
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>';

        setTimeout(() => {
            alertMessage.classList.add('mt-3');

            if (enteredLogin === VALID_USER.login && enteredPassword === VALID_USER.password) {
                alertMessage.style.color = 'var(--primary-color)';
                alertMessage.textContent = 'Вітаємо, ' + enteredLogin + '.';
                
                sessionStorage.setItem('userName', enteredLogin);

                setTimeout(() => {
                    window.location.href = '../manager/home.html';
                }, 1200);

            } else {
                alertMessage.style.color = 'red';
                alertMessage.textContent = 'Невірний логін або пароль';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }, 1000);
    });
}

function updateGreeting() {
    const greetingElement = document.getElementById('dynamicGreeting');
    if (!greetingElement) return;

    const hour = new Date().getHours();
    const userName = sessionStorage.getItem('userName') || "колего";
    
    let welcomeText = "";
    if (hour >= 5 && hour < 12) welcomeText = "Доброго ранку";
    else if (hour >= 12 && hour < 18) welcomeText = "Доброго дня";
    else if (hour >= 18 && hour < 23) welcomeText = "Доброго вечора";
    else welcomeText = "Доброї ночі";

    greetingElement.textContent = `${welcomeText}, ${userName}!`;
}

function displayUserName() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (userNameDisplay) {
        const storedName = sessionStorage.getItem('userName');
        
        if (storedName) {
            userNameDisplay.textContent = storedName;
        } else {
            userNameDisplay.textContent = "Користувач";
        }
    }
}

// Викликаємо цю функцію всередині DOMContentLoaded, щоб вона спрацьовувала на кожній сторінці
document.addEventListener('DOMContentLoaded', () => {
    displayUserName(); // Оновлення імені в навбарі
    
    // ... твій інший код (привітання, таблиці тощо) ...
});

const mockCategories = [
    { category_number: 1, category_name: "Молочні продукти" },
    { category_number: 2, category_name: "М'ясні вироби" },
    { category_number: 3, category_name: "Овочі та фрукти" },
    { category_number: 4, category_name: "Напої" }
];

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
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    if (document.getElementById('categoryTableBody')) {
        renderCategories(mockCategories);
    }

    const searchInput = document.getElementById('categorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const filtered = mockCategories.filter(cat => 
                cat.category_name.toLowerCase().includes(value)
            );
            renderCategories(filtered);
        });
    }
});

const addCategoryForm = document.getElementById('addCategoryForm');

if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Щоб сторінка не перезавантажилась

        const nameInput = document.getElementById('categoryNameInput');
        const newName = nameInput.value.trim();

        if (newName) {
            const newCategory = {
                category_number: mockCategories.length + 1,
                category_name: newName
            };

            mockCategories.push(newCategory);

            renderCategories(mockCategories);

            addCategoryForm.reset();

            const modalElement = document.getElementById('addCategoryModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
        }
    });
}

const categoryModal = document.getElementById('addCategoryModal');
if (categoryModal) {
    categoryModal.addEventListener('hidden.bs.modal', function () {
        addCategoryForm.reset(); 
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '../shared/login.html'; 
    });
}