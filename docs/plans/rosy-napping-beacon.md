# NX-100: Password Change Required Modal

## Задача
Создать модальное окно, которое показывается когда `mustChangePassword=true` и блокирует доступ к приложению до смены пароля.

## Дизайн (Figma)
- Заголовок: "Password Change Required"
- Поле "Current Password" с toggle visibility (Eye/EyeOff)
- Поле "New Password" с toggle visibility (Eye/EyeOff)
- Кнопки: "Log out" (ghost, слева) и "Save" (primary, справа)
- Размер: sm (400px)

---

## План реализации

### 1. Создать компонент PasswordChangeRequiredModal

**Путь:** `frontend/src/components/PasswordChangeRequiredModal/`

**Файлы:**
- `PasswordChangeRequiredModal.jsx` - основной компонент
- `PasswordChangeRequiredModal.css` - стили
- `index.js` - экспорт

**Функциональность:**
- Использует базовый `Modal` компонент
- Форма с полями currentPassword и newPassword
- Toggle password visibility (Eye/EyeOff иконки)
- Валидация: required поля, минимум 8 символов для нового пароля
- Обработка API ошибок (field-level и general)
- Loading состояние с spinner
- Блокировка закрытия: `showCloseButton={false}`, `closeOnOverlayClick={false}`, `closeOnEscape={false}`

### 2. Интегрировать в App.jsx

Добавить компонент-обертку по аналогии с `SessionExpiredModal`:

```jsx
function PasswordChangeModal() {
  const { mustChangePassword, onPasswordChanged, logout } = useAuth();
  return (
    <PasswordChangeRequiredModal
      isOpen={mustChangePassword}
      onPasswordChanged={onPasswordChanged}
      onLogout={logout}
    />
  );
}
```

Добавить `<PasswordChangeModal />` в `AppRoutes` после `<SessionExpiredModal />`.

---

## Критичные файлы

| Файл | Назначение |
|------|-----------|
| `frontend/src/components/Modal/Modal.jsx` | Базовый компонент модалки |
| `frontend/src/components/Field/Field.jsx` | Поле ввода с rightIcon |
| `frontend/src/components/Button/Button.jsx` | Кнопки Log out и Save |
| `frontend/src/api/authApi.js` | `changePassword` API функция |
| `frontend/src/hooks/useApiCall.js` | Hook для API вызовов |
| `frontend/src/contexts/AuthContext.jsx` | `mustChangePassword`, `onPasswordChanged`, `logout` |
| `frontend/src/App.jsx` | Точка интеграции |

---

## Верификация

1. Запустить frontend: `cd frontend && npm run dev`
2. Залогиниться пользователем с `mustChangePassword=true`
3. Проверить:
   - Модалка появляется и блокирует интерфейс
   - Нельзя закрыть (overlay, Escape, X)
   - Валидация работает (пустые поля, короткий пароль)
   - API ошибки отображаются корректно
   - После успешной смены пароля модалка закрывается
   - Кнопка "Log out" выполняет logout
