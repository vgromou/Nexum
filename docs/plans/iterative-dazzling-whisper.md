# План исправлений: useApiCall hook

## Проблемы для исправления

### 1. Критично: Баг с retry (не работает)
**Файл:** `frontend/src/hooks/useApiCall.js:68-71, 148-151`

**Проблема:** `apiPromise` уже промис, `() => apiPromise` возвращает тот же промис при каждой попытке retry.

**Решение:** Изменить сигнатуру `call` - принимать функцию, создающую промис:
```javascript
// Было:
call(apiPromise, options)

// Станет:
call(apiCallFn, options)
// где apiCallFn - функция, возвращающая промис
```

### 2. Дублирование кода между хуками
**Файл:** `frontend/src/hooks/useApiCall.js`

**Решение:** Извлечь общую логику в функцию `executeApiCall`.

### 3. Неполный тест для success toast
**Файл:** `frontend/src/hooks/useApiCall.test.jsx:81-91`

**Решение:** Замокать `useToast` и проверить вызов `showToast`.

### 4. Мок retry не тестирует реальную логику
**Файл:** `frontend/src/hooks/useApiCall.test.jsx:11-13`

**Решение:** Добавить тест для проверки нескольких попыток retry.

### 5. Нестандартный экспорт в index.js
**Файл:** `frontend/src/hooks/index.js:1`

**Решение:** Убрать `default as useAuthDefault`, оставить только named export.

---

## Изменения по файлам

### `frontend/src/hooks/useApiCall.js`
1. Изменить сигнатуру `call` на `call(apiCallFn, options)` где `apiCallFn` - функция
2. Обновить JSDoc и примеры
3. Извлечь общую логику в `executeApiCall`

### `frontend/src/hooks/useApiCall.test.jsx`
1. Обновить тесты под новую сигнатуру (передавать `() => Promise`)
2. Замокать `useToast` для проверки success toast
3. Добавить тест для retry с несколькими попытками

### `frontend/src/hooks/index.js`
1. Упростить экспорт useAuth

---

## Верификация
1. Запустить тесты: `npm test -- useApiCall`
2. Проверить что все тесты проходят
