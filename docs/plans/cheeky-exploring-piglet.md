# План: Исправления по code review UserCard

## Файлы для изменения

- `frontend/src/components/UserCard/UserCard.jsx`
- `frontend/src/components/UserCard/UserCard.css`

## Правки

### 1. Вынести CopyableText за пределы компонента
**Файл:** `UserCard.jsx`

Перенести компонент `CopyableText` из тела `UserCard` (строка 176) наружу, передавая `copiedField` и `copyToClipboard` через props.

### 2. Вынести magic number в константу
**Файл:** `UserCard.jsx`

```js
// Было:
const isContactsShort = (email?.length || 0) + (username?.length || 0) < 35;

// Станет:
const CONTACTS_INLINE_THRESHOLD = 35;
const isContactsShort = (email?.length || 0) + (username?.length || 0) < CONTACTS_INLINE_THRESHOLD;
```

### 3. Удалить неиспользуемый параметр isLink
**Файл:** `UserCard.jsx`

Удалить `isLink = false` из параметров CopyableText.

### 4. Заменить hardcoded spacing на CSS переменную
**Файл:** `UserCard.css`

```css
/* Было: */
.user-card__contacts-separator {
    margin: 0 9px;
}

/* Станет: */
.user-card__contacts-separator {
    margin: 0 var(--space-sm);  /* 8px, ближайшее значение */
}
```

## Верификация

1. Запустить тесты: `npm test -- UserCard`
2. Проверить Storybook: убедиться что UserCard выглядит корректно в обоих режимах
