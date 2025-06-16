// Функции для работы с аутентификацией
let currentUser = null;

// Проверка токена при загрузке страницы
export async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        if (window.location.pathname !== '/auth.html') {
            window.location.href = '/auth.html';
        }
        return false;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token invalid');
        }

        const userData = await response.json();
        currentUser = userData;
        
        // Если мы на странице auth.html и токен валидный, перенаправляем на board.html
        if (window.location.pathname === '/auth.html') {
            window.location.href = '/board.html';
            return false;
        }
        
        updateUserInterface(userData);
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        if (window.location.pathname !== '/auth.html') {
            window.location.href = '/auth.html';
        }
        return false;
    }
}

// Обновление интерфейса после успешной аутентификации
function updateUserInterface(userData) {
    const userInitial = document.getElementById('userInitial');
    const userAvatar = document.getElementById('userAvatar');
    const userNameInMenu = document.querySelector('#accountMenu #userName');
    const userEmail = document.getElementById('userEmail');
    const userCreated = document.getElementById('userCreated');

    if (userData.avatarUrl && userAvatar) {
        userAvatar.src = userData.avatarUrl;
        userAvatar.style.display = 'inline-block';
        if (userInitial) userInitial.style.display = 'none';
    } else {
        if (userAvatar) userAvatar.style.display = 'none';
        if (userInitial && userData.username) {
            userInitial.textContent = userData.username.charAt(0).toUpperCase();
            userInitial.style.display = 'inline-block';
        }
    }
    if (userNameInMenu) userNameInMenu.textContent = userData.username || '';
    if (userEmail && userData.email) {
        userEmail.textContent = userData.email;
    }
    if (userCreated && (userData.created_at || userData.created)) {
        const created = new Date(userData.created_at || userData.created);
        userCreated.textContent = `Создан: ${created.toLocaleDateString()}`;
    }
}

// Загрузка профиля пользователя
export async function loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            const userInitial = document.getElementById('userInitial');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userCreated = document.getElementById('userCreated');
            if (userInitial && user.username) userInitial.textContent = user.username[0].toUpperCase();
            if (userName && user.username) userName.textContent = user.username;
            if (userEmail && user.email) userEmail.textContent = user.email;
            if (userCreated && user.created) userCreated.textContent = `Создан: ${new Date(user.created).toLocaleDateString()}`;
            return user;
        } else {
            throw new Error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        return null;
    }
}

// Выход из системы
export async function logout() {
    try {
        const token = localStorage.getItem('token');
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        window.location.href = '/auth.html';
    }
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
        
        console.log('Menu visibility:', {
            display: menu.style.display,
            hasActiveClass: menu.classList.contains('active')
        });
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

// Проверяем аутентификацию при загрузке страницы
document.addEventListener('DOMContentLoaded', checkAuth);

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