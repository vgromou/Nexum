# План: Исправления по ревью коммита ce13c38

## Задачи

### 1. Исправить импорт useEffect в PasswordChangeRequiredModal
**Файл:** `frontend/src/components/PasswordChangeRequiredModal/PasswordChangeRequiredModal.jsx`

```jsx
// Было:
import React, { useState, useCallback } from 'react';
// ...
React.useEffect(() => { ... })

// Станет:
import { useState, useCallback, useEffect } from 'react';
// ...
useEffect(() => { ... })
```

### 2. Исправить порядок иконок Eye/EyeOff
**Файл:** `frontend/src/components/PasswordChangeRequiredModal/PasswordChangeRequiredModal.jsx`

Строки 154 и 166 - инвертировать логику:
```jsx
// Было:
rightIcon={showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}

// Станет:
rightIcon={showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
```

### 3. Исправить имя поля ошибки в LoginPage (БАГ!)
**Файл:** `frontend/src/pages/LoginPage/LoginPage.jsx`

ASP.NET возвращает ошибки валидации с PascalCase ключами (`Login`, `Password`).
В текущем коде используется `fieldErrors.login` (camelCase) - это не будет работать!

```jsx
// Было:
usernameError={fieldErrors.login}
passwordError={fieldErrors.password}

// Станет:
usernameError={fieldErrors.Login}
passwordError={fieldErrors.Password}
```

### 4. Убрать неиспользуемый return из changePassword
**Файл:** `frontend/src/api/authApi.js`

```jsx
// Было:
/**
 * @returns {Promise<object>} Response object
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await client.post('/api/auth/change-password', {...});
  return response;
};

// Станет:
/**
 * @returns {Promise<void>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  await client.post('/api/auth/change-password', {...});
};
```

### 5. Исправить оставшуюся русскую строку в errorHandler
**Файл:** `frontend/src/services/errorHandler.js`

Строка 123:
```js
// Было:
'Произошла ошибка',

// Станет:
'An error occurred',
```

## Файлы для изменения
- `frontend/src/components/PasswordChangeRequiredModal/PasswordChangeRequiredModal.jsx`
- `frontend/src/pages/LoginPage/LoginPage.jsx`
- `frontend/src/api/authApi.js`
- `frontend/src/services/errorHandler.js`

## Верификация
1. Запустить `npm run dev` во frontend - проверить что приложение запускается
2. Попробовать логин с невалидными данными - убедиться что ошибки отображаются
3. Проверить работу модала смены пароля (если есть тестовый пользователь с `must_change_password=true`)
