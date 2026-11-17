/**
 * Приймач заявок з сайту: записує заявку в Google-таблицю.
 *
 * Як встановити:
 * 1. Google-таблиця → Розширення → Apps Script → вставити цей код у Code.gs → зберегти.
 *    (Або окремий проєкт на script.google.com — тоді вкажіть SPREADSHEET_ID нижче.)
 * 2. Розгорнути → Нове розгортання → Веб-застосунок, від імені «Я», доступ «Усі».
 * 3. URL веб-застосунку (/exec) вписати в FORM_ENDPOINT у файлі site.config.mjs.
 *
 * Після кожної зміни коду: Розгорнути → Керувати розгортаннями → олівець →
 * Нова версія. І збільшити VERSION нижче, щоб перевірити, що оновлення спрацювало.
 */

var VERSION = 4;
var SHEET_NAME = 'Заявки';
var HEADERS = ['Дата', "Ім'я", 'Email', 'Телефон', 'Форма'];
// Підписка на розсилку з підвалу (service: 'Newsletter') — окремий лист
var NEWS_SHEET_NAME = 'Підписки';
var NEWS_HEADERS = ['Дата', 'Email'];
// ID таблиці (з її адреси: /spreadsheets/d/ID/edit). Потрібен, лише якщо скрипт
// створено окремо, а не через «Розширення → Apps Script» у самій таблиці.
var SPREADSHEET_ID = '';

function doPost(e) {
  try {
    var data = {};
    try {
      data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (parseError) {
      return json_({ ok: false, error: 'Невірний формат даних' });
    }

    // Поле-пастка: людина його не бачить, а бот заповнює
    if (data.website) {
      return json_({ ok: true });
    }

    // Підписка з підвалу: лише e-mail
    if (String(data.service || '') === 'Newsletter') {
      var email = String(data.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json_({ ok: false, error: 'Невірний email' });
      }
      appendRow_(NEWS_SHEET_NAME, NEWS_HEADERS, [new Date(), email]);
      return json_({ ok: true });
    }

    var name = String(data.name || '').trim();
    var phone = String(data.phone || '').trim();
    var leadEmail = String(data.email || '').trim();
    var service = String(data.service || 'Заявка з сайту').trim();

    if (!name || !phone) {
      return json_({ ok: false, error: "Вкажіть ім'я і телефон" });
    }

    appendRow_(SHEET_NAME, HEADERS, [new Date(), name, leadEmail, phone, service]);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Помилка сервера' });
  }
}

// Відкрийте URL /exec в інкогніто — побачите номер версії
function doGet() {
  return json_({ ok: true, version: VERSION });
}

// Додає рядок на лист; якщо листа немає — створює його із заголовками
function appendRow_(sheetName, headers, row) {
  var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(row);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
