// Система авторизации с Google Sheets
// Использует localStorage для хранения сессии и Google Sheets для проверки учетных данных

// ===== НАСТРОЙКА =====
// ID вашей таблицы из URL
const SPREADSHEET_ID = '11sIaQCFwH7aH5Zo5Nlv714FE6PYQF5QIcLwnjBpFYnM';

// Вариант 1: Используйте URL вашего Google Apps Script веб-приложения
// После настройки Apps Script вставьте сюда URL веб-приложения
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQPT6itPj2aRWUDEz8fyBBOWxFnF63YsnQglpnV4CcVjBmpu3caV2XA_OaNFIP65cMYA/exec';

// Вариант 2: URL опубликованной Google Таблицы в формате CSV
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;

// Режим работы: 'apps-script' (рекомендуется) или 'csv' (проще)
const AUTH_MODE = 'csv'; // Измените на 'apps-script' после настройки Apps Script

/**
 * Хеширует пароль (простое хеширование для демонстрации)
 * В реальном приложении используйте более надежные методы
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Проверяет учетные данные через Google Apps Script
 */
async function authenticateViaAppsScript(username, password) {
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'authenticate',
                username: username,
                password: password
            })
        });

        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        return false;
    }
}

/**
 * Проверяет учетные данные через CSV таблицу
 */
async function authenticateViaCSV(username, password) {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();
        
        // Парсим CSV
        const lines = csvText.split('\n');
        const users = [];
        
        for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
            const [user, pass] = lines[i].split(',').map(s => s.trim());
            if (user && pass) {
                users.push({ username: user, password: pass });
            }
        }
        
        // Проверяем учетные данные
        const passwordHash = await hashPassword(password);
        const user = users.find(u => 
            u.username === username && 
            (u.password === password || u.password === passwordHash)
        );
        
        return user !== undefined;
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        return false;
    }
}

/**
 * Проверяет учетные данные пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<boolean>} - true если учетные данные верны
 */
async function login(username, password) {
    let authenticated = false;
    
    if (AUTH_MODE === 'apps-script') {
        authenticated = await authenticateViaAppsScript(username, password);
    } else if (AUTH_MODE === 'csv') {
        authenticated = await authenticateViaCSV(username, password);
    }
    
    if (authenticated) {
        // Создаем сессию
        const session = {
            username: username,
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
