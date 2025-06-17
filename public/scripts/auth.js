// Упрощенная версия без авторизации
let currentUser = {
    username: 'Гость',
    email: 'guest@example.com',
    created: new Date().toISOString()
};

// Функция для обновления интерфейса
function updateUserInterface(userData) {
    const userInitial = document.getElementById('userInitial');
    const userAvatar = document.getElementById('userAvatar');
    const userNameInMenu = document.querySelector('#accountMenu #userName');
    const userEmail = document.getElementById('userEmail');
    const userCreated = document.getElementById('userCreated');

    if (userInitial && userData.username) {
        userInitial.textContent = userData.username.charAt(0).toUpperCase();
        userInitial.style.display = 'inline-block';
    }
    if (userNameInMenu) userNameInMenu.textContent = userData.username || '';
    if (userEmail && userData.email) {
        userEmail.textContent = userData.email;
    }
    if (userCreated) {
        const created = new Date(userData.created);
        userCreated.textContent = `Создан: ${created.toLocaleDateString()}`;
    }
}

// Загрузка профиля пользователя
export async function loadUserProfile() {
    return currentUser;
}

// Управление выпадающим меню аккаунта
export function toggleMenu() {
    try {
        const menu = document.getElementById('accountMenu');
        if (!menu) {
            console.error('Menu not found');
            return;
        }
        menu.classList.toggle('active');
    } catch (error) {
        console.error('Error in toggleMenu:', error);
    }
}

// Закрытие меню при клике вне его
document.addEventListener('click', (event) => {
    try {
        const menu = document.getElementById('accountMenu');
        const accountButton = document.querySelector('.account-button');
        
        if (!menu || !accountButton) return;
        
        if (!menu.contains(event.target) && !accountButton.contains(event.target)) {
            menu.classList.remove('active');
        }
    } catch (error) {
        console.error('Error in click handler:', error);
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateUserInterface(currentUser);
});

// Функция регистрации
export async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const messageEl = document.getElementById('reg-message');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.innerHTML = '<div class="success">Регистрация успешна!</div>';
            localStorage.setItem('token', data.token);
            
            // Проверяем валидность токена перед редиректом
            const verifyResponse = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });
            
            if (verifyResponse.ok) {
                window.location.href = '/index.html';
            } else {
                throw new Error('Token verification failed');
            }
        } else {
            messageEl.innerHTML = `<div class="error">${data.error}</div>`;
        }
    } catch (error) {
        messageEl.innerHTML = '<div class="error">Ошибка при регистрации</div>';
        localStorage.removeItem('token');
    }
}

// Функция входа
export async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageEl.innerHTML = '<div class="success">Вход выполнен успешно!</div>';
            localStorage.setItem('token', data.token);
            
            // Проверяем валидность токена перед редиректом
            const verifyResponse = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });
            
            if (verifyResponse.ok) {
                window.location.href = '/board.html';
            } else {
                throw new Error('Token verification failed');
            }
        } else {
            messageEl.innerHTML = `<div class="error">${data.error}</div>`;
        }
    } catch (error) {
        messageEl.innerHTML = '<div class="error">Ошибка при входе</div>';
        localStorage.removeItem('token');
    }
}

// Делаем функции доступными глобально для использования в HTML
window.register = register;
window.login = login;
window.logout = logout; 