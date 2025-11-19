// Система авторизации для GitHub Pages
// Использует localStorage для хранения сессии

// Учетные данные пользователей (в реальном приложении это должно быть на сервере)
const users = [
    { username: 'admin', password: 'admin100' },
    { username: 'user', password: '12345' }
];

/**
 * Проверяет учетные данные пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {boolean} - true если учетные данные верны
 */
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Создаем сессию
        const session = {
            username: user.username,
            loginTime: new Date().toISOString(),
            token: generateToken()
        };
        
        localStorage.setItem('authSession', JSON.stringify(session));
        return true;
    }
    
    return false;
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('authSession');
    window.location.href = 'login.html';
}

/**
 * Проверяет, авторизован ли пользователь
 * @returns {boolean} - true если пользователь авторизован
 */
function isAuthenticated() {
    const session = localStorage.getItem('authSession');
    
    if (!session) {
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        
        // Проверяем, не истекла ли сессия (24 часа)
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            // Сессия истекла
            localStorage.removeItem('authSession');
            return false;
        }
        
        return true;
    } catch (e) {
        // Ошибка парсинга - удаляем поврежденную сессию
        localStorage.removeItem('authSession');
        return false;
    }
}

/**
 * Получает данные текущей сессии
 * @returns {object|null} - Объект с данными сессии или null
 */
function getSession() {
    const session = localStorage.getItem('authSession');
    
    if (!session) {
        return null;
    }
    
    try {
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

/**
 * Генерирует простой токен сессии
 * @returns {string} - Случайный токен
 */
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Защищает страницу - перенаправляет неавторизованных пользователей на страницу входа
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
