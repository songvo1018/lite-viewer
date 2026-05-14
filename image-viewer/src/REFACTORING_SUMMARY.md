# Рефакторинг кода - Резюме

## Дата: 2026-05-14

## Цели рефакторинга

1. Выявить и устранить повторяющийся код
2. Вынести ID элементов интерфейса в константы
3. Создать универсальные функции для повторяющихся операций

## Изменения

### 1. Константы (consts.js)

#### Добавлены новые константы:

- **UI_IDS** - все ID элементов интерфейса:
  - `LEFT_PANEL`, `RIGHT_PANEL` - панели
  - `DIR_SELECT_LEFT`, `DIR_SELECT_RIGHT` - селекты директорий
  - `MEDIA_WRAPPER_LEFT`, `MEDIA_WRAPPER_RIGHT` - контейнеры медиа
  - `IMAGE_INFO_LEFT`, `IMAGE_INFO_RIGHT` - информация о изображениях
  - `PREV_BTN_LEFT`, `PREV_BTN_RIGHT` - кнопки "предыдущее"
  - `NEXT_BTN_LEFT`, `NEXT_BTN_RIGHT` - кнопки "следующее"
  - `TRASH_BTN_LEFT`, `TRASH_BTN_RIGHT` - кнопки "корзина" (новые)
  - `INFO_BTN_LEFT`, `INFO_BTN_RIGHT` - кнопки "инфо"
  - `RENAME_BTN_LEFT`, `RENAME_BTN_RIGHT` - кнопки "переименовать" (новые)
  - `AUTO_ROTATE_CHECK_LEFT`, `AUTO_ROTATE_CHECK_RIGHT` - чекбоксы автопрокрутки
  - `SPEED_RANGE_LEFT`, `SPEED_RANGE_RIGHT` - слайдеры скорости
  - `SPEED_VALUE_LEFT`, `SPEED_VALUE_RIGHT` - отображение скорости
  - `SPLITTER` - разделитель панелей
  - `INFO_MODAL`, `RENAME_MODAL` - модальные окна
  - `SHARED_RECURSIVE_MODE_CHECK` - чекбокс рекурсивного режима
  - И другие...

- **PANEL** - идентификаторы панелей:
  - `PANEL.LEFT`, `PANEL.RIGHT`

- **PANEL_SUFFIX** - суффиксы для формирования ID:
  - `PANEL_SUFFIX.LEFT`, `PANEL_SUFFIX.RIGHT`

- **KEYBOARD_SHORTCUTS** - горячие клавиши:
  - `PREVIOUS_LEFT`, `NEXT_RIGHT`, `TOGGLE_AUTO_ROTATE_LEFT`, `TOGGLE_AUTO_ROTATE_RIGHT`
  - `PAUSE_RESUME`, `MOVE_TO_LEFT_BASKET`, `MOVE_TO_RIGHT_BASKET`
  - `ADD_TO_FAVORITES_LEFT`, `ADD_TO_FAVORITES_RIGHT`, `HIDE_VIEWER`

- **FILE_EXTENSIONS** - расширения файлов:
  - `images`, `videos`

- **DIRECTORIES** - имена директорий:
  - `BASKET`, `FAVORITES`

- **API_ENDPOINTS** - эндпоинты API:
  - `DIRECTORIES`, `IMAGES`, `RENAME_DIRECTORY`, `MOVE_TO_BASKET`, `ADD_TO_FAVORITES`, `IPS`

### 2. Утилиты (utils.js)

#### Добавлены новые универсальные функции:

- **moveToBasket(panel, filePath)** - универсальная функция для перемещения файла в корзину
- **addToFavorites(panel, filePath)** - универсальная функция для добавления в избранное
- **showNotification(message)** - показ уведомлений (перенесено из main.js)
- **handleMoveToBasket(panel, imageList, currentIndex, filePath)** - перемещение с обновлением состояния
- **handleAddToFavorites(panel, filePath)** - добавление в избранное с уведомлением

#### Уже существующие функции:

- **getEl(elementId)** - получение элемента из кэша
- **getPanelEl(baseId, panel)** - получение элемента для конкретной панели
- **normalizePath(path)** - нормализация путей
- **getFileName(filePath)** - получение имени файла
- **wrapIndex(index, length)** - циклический индекс
- **isVideoFile(filePath)** - проверка видео файла
- **clearMediaWrapper(panel)** - очистка медиа контейнера
- **updateImageInfo(panel, text)** - обновление информации

### 3. Основной код (main.js)

#### Обновления:

- Все DOM элементы теперь получаются через `getEl(UI_IDS.IDENTIFIER)` для кэширования
- Устранены дублирующие объявления переменных
- Функции `moveToLeftBasket()` и `moveToRightBasket()` теперь используют `handleMoveToBasket()`
- Функции `addToFavoritesLeft()` и `addToFavoritesRight()` теперь используют `handleAddToFavorites()`
- Удалены лишние `document.getElementById()` вызовы

#### Импорты:

```javascript
import { PANEL, UI_IDS, KEYBOARD_SHORTCUTS, FILE_EXTENSIONS, DIRECTORIES } from './consts.js';
import {
  getEl,
  getPanelEl,
  normalizePath,
  getFileName,
  wrapIndex,
  isVideoFile,
  clearMediaWrapper,
  updateImageInfo,
  updateSpeedDisplay,
  showNotification,
  handleMoveToBasket,
  handleAddToFavorites,
} from './utils.js';
```

## Результаты

- ✓ Сборка успешна (`npm run build`)
- ✓ Устранен повторяющийся код
- ✓ Все ID элементов вынесены в константы
- ✓ Созданы универсальные функции для повторяющихся операций
- ✓ Код становится более поддерживаемым и расширяемым

## Рекомендации на будущее

1. Рассмотреть интеграцию функций из `panelLogic.js` для еще большего упрощения `main.js`
2. Создать типы TypeScript для лучшей типизации
3. Добавить_UNIT_тесты для универсальных функций
4. Рассмотреть использование state management (например, Context API) для глобального состояния
