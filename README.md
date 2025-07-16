# 🌾 АГРО-ПРОСТІР PWA

Інтерактивна платформа для аграрного сектору України з підтримкою PWA та збереженням Client ID.

## 🚀 Швидкий старт

### Локальна розробка:
```bash
php -S localhost:8080
```

### Доступ з Client ID:
```
http://localhost:8080/index.html?id=YOUR_CLIENT_ID
```

## 📱 PWA функціональність

### ✅ Реалізовано:
- **Client ID збереження** - автоматичне збереження між сесіями
- **Динамічний маніфест** - `dynamic_manifest.php` з client-specific start_url
- **Fallback система** - автоматичний перехід до статичного маніфеста
- **Service Worker** - кешування та offline підтримка
- **Кросплатформність** - працює на iOS, Android, Desktop

### 🔧 Ключові файли:
- `index.html` - основний додаток з PWA логікою
- `dynamic_manifest.php` - динамічний генератор маніфеста
- `manifest.json` - статичний fallback маніфест
- `sw.js` - Service Worker з кешуванням
- `.htaccess` - конфігурація сервера

## 🧪 Тестування

### Тестові сторінки:
- `test_manifest_fix.html` - комплексне тестування функцій
- `success_page.html` - підсумок успішного виправлення

### Команди:
```bash
# Тест основного додатку
http://localhost:8080/index.html?id=53f5172d-786f-4978-9607-4f699ecb7b7c

# Тест динамічного маніфеста
http://localhost:8080/dynamic_manifest.php?id=53f5172d-786f-4978-9607-4f699ecb7b7c

# Комплексне тестування
http://localhost:8080/test_manifest_fix.html
```

## 📋 Вимоги

### Сервер:
- PHP 7.4+ з підтримкою JSON
- Apache/Nginx з підтримкою .htaccess
- HTTPS (обов'язково для production PWA)

### Браузери:
- Chrome 80+ ✅
- Safari 14+ ✅  
- Firefox 90+ ✅
- Edge 80+ ✅

## 🔄 Механізм роботи

1. **Ініціалізація:** Додаток визначає Client ID з URL або localStorage
2. **Маніфест:** Динамічно генерується з правильним start_url
3. **Встановлення:** PWA зберігає Client ID в start_url маніфеста
4. **Запуск:** При відкритті PWA Client ID автоматично завантажується

## 📊 Структура даних

```
data/
├── {client_id}/
│   ├── file_list.json
│   └── [інші client-specific файли]
└── [загальні файли як fallback]
```

## 🛠️ Розгортання

### Production checklist:
- [ ] HTTPS налаштовано
- [ ] PHP сервер підтримує заголовки
- [ ] Файл .htaccess завантажено
- [ ] Service Worker кешує правильні ресурси
- [ ] Тестування на різних пристроях

### Оновлення:
Змініть версію кешу в `sw.js` для оновлення PWA:
```javascript
const CACHE_NAME = 'agro-prostir-v3.1-manifest-fix';
```

---

**Статус:** ✅ Готово до production  
**Останнє оновлення:** 16 липня 2025  
**Версія PWA:** 3.1 (manifest-fix)
