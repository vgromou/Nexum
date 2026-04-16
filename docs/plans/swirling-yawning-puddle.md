# План: Исправления по code review коммита d606da6

## Файлы для изменения

1. **frontend/src/pages/LoginPage/LoginPage.jsx**
2. **frontend/src/components/UserCard/UserCard.jsx**

---

## Изменение 1: LoginPage.jsx — убрать хак с пробелом

**Проблема**: `username: ' '` — неочевидный хак для подсветки поля.

**Решение**: Показывать одно сообщение об ошибке под полем password (оба поля могут быть неверны, но сообщение одно).

```jsx
// Было:
setErrors({
  username: ' ',
  password: message || 'Invalid username or password',
  general: '',
});

// Станет:
setErrors({
  username: '',
  password: message || 'Invalid username or password',
  general: '',
});
```

---

## Изменение 2: UserCard.jsx — signOutButtonRef для expanded режима

**Проблема**: В expanded режиме кнопка logout не обёрнута в div с ref, popover позиционируется неверно.

**Решение**: Создать отдельный ref для expanded режима и передавать актуальный ref в ConfirmationPopover.

```jsx
// Добавить ref:
const signOutButtonExpandedRef = useRef(null);

// Обернуть кнопку в expanded режиме:
<div ref={signOutButtonExpandedRef}>
  <IconButton ... />
</div>

// Передавать актуальный ref в popover:
anchorRef={isExpanded ? signOutButtonExpandedRef : signOutButtonRef}
```

---

## Изменение 3: UserCard.jsx — убрать document.querySelector

**Проблема**: `document.querySelector('.confirmation-popover')` — ненадёжный селектор.

**Решение**: Использовать ref для popover и проверять через состояние `isSignOutPopoverOpen`.

```jsx
// Было:
const handleClickOutside = (event) => {
  const popover = document.querySelector('.confirmation-popover');
  if (popover?.contains(event.target)) {
    return;
  }
  ...
};

// Станет:
const handleClickOutside = (event) => {
  // Don't close UserCard while sign out popover is open
  if (isSignOutPopoverOpen) {
    return;
  }
  ...
};
```

---

## Изменение 4: UserCard.jsx — вынести текст в константу

**Проблема**: Хардкод "Sign out of Nexum?".

**Решение**: Вынести в константу в начало файла.

```jsx
// Добавить константу:
const SIGN_OUT_CONFIRMATION_TITLE = 'Sign out of Nexum?';

// Использовать:
title={SIGN_OUT_CONFIRMATION_TITLE}
```

---

## Верификация

1. Запустить frontend: `cd frontend && npm run dev`
2. Проверить LoginPage:
   - Ввести неверные credentials → ошибка под полем password
3. Проверить UserCard:
   - Открыть карточку в compact режиме → нажать logout → popover появляется под кнопкой
   - Развернуть карточку (expanded) → нажать logout → popover появляется под кнопкой
   - При открытом popover кликнуть вне карточки → карточка НЕ закрывается
   - Нажать Cancel → popover закрывается
   - Нажать Sign Out → выход выполняется
