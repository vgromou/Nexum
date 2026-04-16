# План: Исправления по ревью API клиента

## Файл для изменения
`frontend/src/api/client.js`

## Изменения

### 1. Добавить обработку ошибок для refreshError (строка ~214)

**До:**
```javascript
return Promise.reject(refreshError);
```

**После:**
```javascript
if (originalRequest?.handleErrors) {
  const parsed = handleApiError(refreshError);
  refreshError.parsed = parsed;
}
return Promise.reject(refreshError);
```

### 2. Изменить проверку handleErrors на truthy (строка ~228)

**До:**
```javascript
if (originalRequest?.handleErrors === true) {
```

**После:**
```javascript
if (originalRequest?.handleErrors) {
```

## Верификация

1. Запустить frontend: `cd frontend && npm run dev`
2. Проверить, что API запросы работают корректно
3. Проверить обработку ошибок с `handleErrors: true`
