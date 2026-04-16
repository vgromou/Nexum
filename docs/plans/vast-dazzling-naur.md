# План исправлений по ревью коммита 4b9450a

## Файлы для изменения

### 1. `frontend/src/styles/variables.css`
Добавить CSS-переменную для z-index dropdown:
```css
--z-index-dropdown: 1150;  /* между popover и modal */
```

### 2. `frontend/src/components/Select/Select.css` (строка 230)
Заменить hardcoded z-index:
```css
/* Было */
z-index: 9999;
/* Станет */
z-index: var(--z-index-dropdown);
```

### 3. `frontend/src/components/DatePicker/DatePicker.css` (строка 156)
Аналогично:
```css
z-index: var(--z-index-dropdown);
```

### 4. `frontend/src/hooks/useDropdownPosition.js`
Добавить опцию `dropdownHeight` в options вместо hardcoded 300:
```javascript
const { placement = 'bottom', offset = 4, dropdownHeight = 300 } = options;
```

### 5. `frontend/src/components/Portal/Portal.jsx`
Упростить компонент, убрав избыточный useEffect:
```jsx
const Portal = ({ children, container }) => {
    const mountNode = container || (typeof document !== 'undefined' ? document.body : null);
    if (!mountNode) return null;
    return createPortal(children, mountNode);
};
```

### 6. `frontend/src/components/DatePicker/DatePicker.jsx`
Сделать `applyDateMask` динамической в зависимости от формата. Функция должна определять позиции разделителей на основе prop `format`.

### 7. `frontend/src/components/UserSettings/SecurityTab.jsx`
Добавить prop `isLoading` и состояние загрузки для кнопки "Change Password":
- Принимать `isLoading` prop
- Показывать состояние загрузки на кнопке
- Блокировать форму во время отправки

### 8. `frontend/src/components/UserSettings/UserDetailsTab.jsx`
Вынести `JOB_TITLE_OPTIONS` и `DEPARTMENT_OPTIONS` в props:
- Добавить props `jobTitleOptions` и `departmentOptions`
- Использовать default values для обратной совместимости

---

## Верификация
1. Запустить тесты: `npm test --prefix frontend`
2. Проверить Storybook: `npm run storybook --prefix frontend`
3. Визуально проверить Select и DatePicker в диалогах
