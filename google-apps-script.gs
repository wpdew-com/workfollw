/**
 * Google Apps Script для работы с аутентификацией
 * 
 * ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
 * 
 * 1. Откройте Google Sheets и создайте таблицу со структурой:
 *    | username | password | email          | registered_date |
 *    |----------|----------|----------------|-----------------|
 *    | admin    | admin100 | admin@test.com | 2025-01-01      |
 *    | user     | 12345    | user@test.com  | 2025-01-01      |
 * 
 * 2. Перейдите в "Расширения" → "Apps Script"
 * 
 * 3. Скопируйте этот код в редактор Apps Script
 * 
 * 4. Нажмите "Развернуть" → "Новое развертывание"
 *    - Тип: Веб-приложение
 *    - Выполнять как: Я
 *    - У кого есть доступ: Все
 * 
 * 5. Скопируйте URL веб-приложения и вставьте в auth-google-sheets.js
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'authenticate') {
      return authenticateUser(data.username, data.password);
    } else if (action === 'register') {
      return registerUser(data.username, data.password, data.email);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'API работает!'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Use POST request'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Аутентификация пользователя
 */
function authenticateUser(username, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Пропускаем заголовок (первая строка)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const storedUsername = row[0]; // Колонка A
    const storedPassword = row[1]; // Колонка B
    
    if (storedUsername === username && storedPassword === password) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        username: username,
        email: row[2] || '',
        message: 'Аутентификация успешна'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Неверное имя пользователя или пароль'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Регистрация нового пользователя
 */
function registerUser(username, password, email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Проверяем, существует ли уже такой пользователь
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Пользователь уже существует'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Добавляем нового пользователя
  const today = new Date().toISOString().split('T')[0];
  sheet.appendRow([username, password, email, today]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Пользователь успешно зарегистрирован'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Получение списка всех пользователей (только для администраторов)
 */
function getAllUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      username: data[i][0],
      email: data[i][2],
      registered: data[i][3]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    users: users
  })).setMimeType(ContentService.MimeType.JSON);
}
