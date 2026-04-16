# Ревью незапушенных коммитов: удаление legacy `silent`

## Обзор

Всего 67 незапушенных коммитов на ветке `feature/auth`. Последний коммит `75e6568` частично заменил `silent` на `none`/`skipErrorHandler`, но в `errorHandler.js` осталась опция `silent`.

## Проблема

В коммите `75e6568 refactor(frontend): Replace silent with none displayType (NX-129)` было сделано:
- ✅ В `useApiCall.js`: опция `silent` переименована в `skipErrorHandler`
- ✅ В `errorHandler.js`: `displayType: 'silent'` заменён на `displayType: 'none'`
- ❌ **Но осталась** опция `silent` в функции `handleApiError(error, options)`

Сейчас есть дублирование:
- `handleApiError(error, { silent: true })` - **legacy, нужно удалить**
- `handleApiError(error, { overrideDisplayType: 'none' })` - **корректный способ**

## План изменений

### 1. `frontend/src/services/errorHandler.js`

**Удалить:**
- Строка 162: JSDoc для `@param {boolean} [options.silent]`
- Строка 167: деструктуризация `silent` из options
- Строки 192-195: блок `if (silent) { return parsed; }`

### 2. `frontend/src/services/errorHandler.test.js`

**Удалить:**
- Строки 250-266: тест `'respects silent option'`

**Изменить:**
- Строка 318: `createErrorHandler({ silent: true })` → `createErrorHandler({ overrideDisplayType: 'none' })`
- Строка 333: `createErrorHandler({ silent: true })` → `createErrorHandler({ overrideDisplayType: 'none' })`
- Строка 342: `handler(error, { silent: false })` → `handler(error, { overrideDisplayType: 'toast' })`

## Верификация

```bash
cd frontend && npm test -- --run errorHandler
```
