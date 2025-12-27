const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQPT6itPj2aRWUDEz8fyBBOWxFnF63YsnQglpnV4CcVjBmpu3caV2XA_OaNFIP65cMYA/exec';
async function authenticateViaAppsScript(username, password) {
    try {
        const url = new URL(GOOGLE_APPS_SCRIPT_URL);
        url.searchParams.append('action', 'authenticate');
        url.searchParams.append('username', username);
        url.searchParams.append('password', password);

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow'
        });

        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Помилка аутентифікації:', error);
        return false;
    }
}
async function login(username, password) {
    const authenticated = await authenticateViaAppsScript(username, password);
    
    if (authenticated) {
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
function logout() {
    localStorage.removeItem('authSession');
    window.location.href = 'login.html';
}
function isAuthenticated() {
    const session = localStorage.getItem('authSession');
    
    if (!session) {
        return false;
    }
    
    try {
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            localStorage.removeItem('authSession');
            return false;
        }
        
        return true;
    } catch (e) {
        localStorage.removeItem('authSession');
        return false;
    }
}
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
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}
