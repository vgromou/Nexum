# Nexum Design System - Документация

**Дата обновления:** 21 января 2026
**Источник:** Figma Design Tokens

## 📋 Обзор

Система дизайна Nexum полностью обновлена с использованием токенов из Figma. Все переменные синхронизированы с дизайн-макетами и готовы к использованию.

## 🎨 Что включено

### 1. Цветовые токены (89 переменных)

**Категории:**
- **Background** - 5 вариантов (Primary, Secondary, Tertiary, Hover, Active)
- **Text** - 8 вариантов (Primary, Secondary, Tertiary, Placeholder, Disabled, Inverse, Link, Link-Hover)
- **Border** - 5 вариантов (Default, Light, Medium, Strong, Focus)
- **Accent** - 6 вариантов (Primary + states, Secondary + Light)
- **Semantic** - 12 вариантов (Success, Error, Warning, Info - по 3 варианта каждый)
- **Icons** - 5 вариантов (Default, Hover, Active, Inverse, Disabled)
- **Interactive** - 5 вариантов (Default, Hover, Active, Disabled, Focus)
- **Surface** - 5 вариантов (Default, Elevated, Sidebar, Card, Overlay)

### 2. Система кнопок (108 переменных, 9 вариантов)

**Основные варианты:**
- **Primary** - основная акцентная кнопка
- **Ghost** - прозрачная кнопка с hover эффектом
- **Outline** - кнопка с обводкой

**Destructive варианты:**
- **Destructive** - для опасных действий (удаление и т.д.)
- **Destructive Ghost** - прозрачный destructive
- **Destructive Outline** - destructive с обводкой

**Success варианты:**
- **Success** - для успешных действий (сохранение и т.д.)
- **Success Ghost** - прозрачный success
- **Success Outline** - success с обводкой

**Каждая кнопка имеет 4 состояния:**
- Default
- Hover
- Active
- Disabled

**Размеры:**
- Small (`.btn-sm`)
- Medium (`.btn-md` или `.btn`)
- Large (`.btn-lg`)

### 3. Тени (6 переменных)

**Default Shadows (черные):**
- `--shadow-sm` - 0 1px 3px rgba(0, 0, 0, 0.06)
- `--shadow-md` - 0 4px 6px rgba(0, 0, 0, 0.1)
- `--shadow-lg` - 0 10px 15px rgba(0, 0, 0, 0.1)

**Accent Shadows (фиолетовые):**
- `--shadow-sm-accent` - 0 1px 3px rgba(94, 106, 210, 0.1)
- `--shadow-md-accent` - 0 4px 8px rgba(94, 106, 210, 0.12)
- `--shadow-lg-accent` - 0 8px 24px rgba(94, 106, 210, 0.15)

### 4. Spacing Scale

**Обновленная шкала отступов:**
```css
--space-xxs: 2px   /* НОВОЕ - из Figma */
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 24px
--space-2xl: 32px
--space-3xl: 48px
--space-4xl: 64px
```

### 5. Border Radius

```css
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px
```

## 🚀 Использование

### Кнопки

**HTML:**
```html
<!-- Primary -->
<button class="btn btn-primary">Кнопка</button>
<button class="btn btn-primary btn-sm">Маленькая</button>
<button class="btn btn-primary btn-lg">Большая</button>

<!-- Ghost -->
<button class="btn btn-ghost">Ghost</button>

<!-- Outline -->
<button class="btn btn-outline">Outline</button>

<!-- Destructive -->
<button class="btn btn-destructive">Удалить</button>
<button class="btn btn-destructive-ghost">Удалить</button>
<button class="btn btn-destructive-outline">Удалить</button>

<!-- Success -->
<button class="btn btn-success">Сохранить</button>
<button class="btn btn-success-ghost">Сохранить</button>
<button class="btn btn-success-outline">Сохранить</button>

<!-- Icon button -->
<button class="btn btn-primary btn-icon">
  <svg>...</svg>
</button>

<!-- Full width -->
<button class="btn btn-primary btn-full">Во всю ширину</button>
```

**React/JSX:**
```jsx
import '../styles/button-utilities.css';

<button className="btn btn-primary">
  Кнопка
</button>
```

### Цвета

```css
/* Background */
background: var(--background-primary);
background: var(--background-secondary);
background: var(--background-hover);

/* Text */
color: var(--text-primary);
color: var(--text-secondary);
color: var(--text-link);

/* Accent */
background: var(--accent-primary);
background: var(--accent-primary-hover);
background: var(--accent-primary-light);

/* Semantic */
color: var(--semantic-success);
color: var(--semantic-error);
color: var(--semantic-warning);
color: var(--semantic-info);
```

### Тени

```css
/* Default shadows */
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);

/* Accent shadows - для привлечения внимания */
box-shadow: var(--shadow-sm-accent);
box-shadow: var(--shadow-md-accent);
box-shadow: var(--shadow-lg-accent);
```

### Spacing

```css
/* Padding */
padding: var(--space-md);
padding: var(--space-sm) var(--space-lg);

/* Margin */
margin-bottom: var(--space-xl);

/* Gap */
gap: var(--space-md);
```

### Border Radius

```css
border-radius: var(--radius-sm);  /* 4px */
border-radius: var(--radius-md);  /* 6px */
border-radius: var(--radius-lg);  /* 8px */
border-radius: var(--radius-xl);  /* 12px */
```

## 📚 Storybook

Вся дизайн-система задокументирована в Storybook.

**Запуск Storybook:**
```bash
cd frontend
npm run storybook
```

**Доступные разделы:**
- **Design System / Overview** - полный обзор дизайн-системы
- **Design System / Button Utilities** - все варианты кнопок с utility классами
- **Design System / Colors** - полная цветовая палитра (все Figma токены + highlight, collection, code colors)
- **Design System / Shadows** - система теней (default + accent варианты)
- **Design System / Spacing** - отступы, радиусы, тени, layout dimensions, z-index, transitions

**Компоненты приложения:**
- Components / Buttons - примеры кнопок из приложения
- Components / Icons - иконки
- Components / Inputs - поля ввода
- Components / Typography - типографика
- Components / Menus - меню
- Components / Navigation - навигация
- Components / Pickers - пикеры

## 🔧 Обновление токенов из Figma

Когда дизайн-токены обновятся в Figma:

1. Экспортируйте новые токены в директорию `figma-tokens/` в корне проекта (или установите переменную окружения `FIGMA_TOKENS_DIR`)
2. Запустите скрипт конвертации:

```bash
cd frontend

# Вариант 1: Использовать дефолтный путь (../figma-tokens)
node scripts/convert-tokens.cjs

# Вариант 2: Указать кастомный путь через переменную окружения
FIGMA_TOKENS_DIR=/path/to/your/tokens node scripts/convert-tokens.cjs
```

3. Скрипт автоматически обновит `src/styles/generated-tokens.css`
4. Проверьте изменения и обновите `src/styles/variables.css` если нужно

**Примечание:** Файл `generated-tokens.css` используется как справочный и не коммитится в репозиторий (см. `.gitignore`).

## 📁 Структура файлов

```
frontend/
├── scripts/
│   └── convert-tokens.cjs          # Скрипт конвертации Figma токенов
├── src/
│   ├── styles/
│   │   ├── variables.css           # Главный файл переменных (РУЧНОЕ ОБНОВЛЕНИЕ)
│   │   ├── button-utilities.css    # Utility классы для кнопок
│   │   ├── generated-tokens.css    # Авто-генерируемый файл (СПРАВОЧНЫЙ)
│   │   ├── StyleGuide.css          # Стили для Style Guide
│   │   └── ...
│   ├── pages/
│   │   └── StyleGuide.jsx          # Полная страница Style Guide
│   └── stories/
│       ├── DesignSystem.stories.jsx      # Обзор дизайн-системы
│       ├── ButtonSystem.stories.jsx      # Система кнопок
│       ├── ColorTokens.stories.jsx       # Цветовые токены
│       ├── Shadows.stories.jsx           # Тени
│       ├── SpacingTokens.stories.jsx     # Отступы и радиусы
│       └── ... (старые истории сохранены)
└── .storybook/
    ├── main.js
    └── preview.js                   # Обновлен для импорта button utilities
```

## ✅ Обратная совместимость

Все существующие переменные сохранены:
- ✅ Legacy color mappings (`--color-gray-*`, `--color-danger`)
- ✅ Typography tokens
- ✅ Layout variables
- ✅ Transition variables
- ✅ Z-index variables

**Новое:**
- ✅ `--space-xxs: 2px` (новый токен из Figma)
- ✅ Accent shadows (`--shadow-*-accent`)
- ✅ Button system (9 вариантов × 4 состояния)
- ✅ Исправлены undefined переменные (`--color-shadow-menu`, `--color-shadow-drag`)

## 🎯 Рекомендации

1. **Используйте utility классы** для кнопок вместо inline стилей
2. **Используйте semantic цвета** для состояний (success, error, warning, info)
3. **Используйте accent shadows** для интерактивных элементов
4. **Используйте spacing scale** вместо жестких значений в px
5. **Проверяйте изменения** в Storybook перед коммитом

## 🔗 Полезные ссылки

- **Storybook:** http://localhost:6006/ (после `npm run storybook`)
- **Style Guide Page:** Импортируйте `StyleGuide` компонент из `src/pages/StyleGuide.jsx`
- **Figma Tokens:** `/Volumes/T9/Variables/`

## 📊 Статистика

- **Всего токенов:** 203 CSS переменных
- **Основные токены:** 89 (цвета, spacing, radius)
- **Токены кнопок:** 108 (9 вариантов × 12 переменных)
- **Токены теней:** 6 (3 default + 3 accent)
- **Размер CSS bundle:** 100.85 KB (включая все токены)
- **Storybook разделы:** 4 раздела Design System + 9 разделов Components

---

**Дата последнего обновления:** 21 января 2026
**Версия:** 1.0.0
**Статус:** ✅ Готово к использованию
