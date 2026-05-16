import { PANEL, UI_IDS, DIRECTORIES, API_ENDPOINTS } from './consts.js';

// Кэш DOM элементов
let elementCache = {};

/**
 * Получить DOM элемент по ID из кэша или DOM
 * @param {string} elementId - ID элемента
 * @returns {HTMLElement|null}
 */
export function getEl(elementId) {
  if (elementCache[elementId]) {
    return elementCache[elementId];
  }

  const element = document.getElementById(elementId);
  if (element) {
    elementCache[elementId] = element;
  }
  return element;
}

/**
 * Получить элемент для конкретной панели
 * @param {string} baseId - Базовый ID (без суффикса)
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @returns {HTMLElement|null}
 */
export function getPanelEl(baseId, panel) {
  const id = UI_IDS[`${baseId}_${panel === PANEL.LEFT ? 'Left' : 'Right'}`];
  return getEl(id);
}

/**
 * Получить элемент для конкретной панели по ID константы
 * @param {string} constantName - Имя константы без суффикса (например, 'MEDIA_WRAPPER')
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @returns {HTMLElement|null}
 */
export function getPanelElByConst(constantName, panel) {
  const suffix = panel === PANEL.LEFT ? 'Left' : 'Right';
  const id = UI_IDS[`${constantName}_${suffix}`];
  return getEl(id);
}

/**
 * Кэшировать все UI элементы при инициализации
 */
export function cacheAllElements() {
  elementCache = {};
  for (const key in UI_IDS) {
    getEl(UI_IDS[key]);
  }
}

/**
 * Получить ID элемента для панели
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @returns {Object} - Объект с ID элементами панели
 */
export function getPanelIds(panel) {
  const suffix = panel === PANEL.LEFT ? 'Left' : 'Right';
  return {
    PANEL: `panel${suffix}`,
    DIR_SELECT: `dirSelect${suffix}`,
    MEDIA_WRAPPER: `mediaWrapper${suffix}`,
    IMAGE_INFO: `imageInfo${suffix}`,
    PREV_BTN: `prevBtn${suffix}`,
    NEXT_BTN: `nextBtn${suffix}`,
    TRASH_BTN: `trashBtn${suffix}`,
    INFO_BTN: `infoBtn${suffix}`,
    RENAME_BTN: `renameBtn${suffix}`,
    AUTO_ROTATE_CHECK: `autoRotateCheck${suffix}`,
    SPEED_RANGE: `speedRange${suffix}`,
    SPEED_VALUE: `speedValue${suffix}`,
  };
}

/**
 * Получить элементы кнопок для панели
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @returns {Object} - Объект с элементами кнопок
 */
export function getPanelButtons(panel) {
  return {
    prev: getPanelEl('PREV_BTN', panel),
    next: getPanelEl('NEXT_BTN', panel),
    trash: getPanelEl('TRASH_BTN', panel),
    info: getPanelEl('INFO_BTN', panel),
    rename: getPanelEl('RENAME_BTN', panel),
  };
}

/**
 * Нормализовать путь: заменить обратные слэши на прямые
 * @param {string} path - Путь
 * @returns {string}
 */
export function normalizePath(path) {
  return (path || '').replace(/\\/g, '/');
}

/**
 * Получить имя файла из пути
 * @param {string} filePath - Полный путь к файлу
 * @returns {string}
 */
export function getFileName(filePath) {
  const normalized = normalizePath(filePath);
  return normalized.split('/').pop() || 'unknown';
}

/**
 * Обернуть индекс в пределах массива (для циклического переключения)
 * @param {number} index - Текущий индекс
 * @param {number} length - Длина массива
 * @returns {number}
 */
export function wrapIndex(index, length) {
  if (length === 0) return 0;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

/**
 * Проверить, является ли файл видео
 * @param {string} filePath - Путь к файлу
 * @returns {boolean}
 */
export function isVideoFile(filePath) {
  return (filePath || '').toLowerCase().endsWith('.mp4');
}

/**
 * Очистить медиа контейнер панели
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 */
export function clearMediaWrapper(panel) {
  const wrapper = getPanelEl('MEDIA_WRAPPER', panel);
  if (wrapper) {
    wrapper.innerHTML = '';
  }
}

/**
 * Обновить текст информации о изображении
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @param {string} text - Текст
 */
export function updateImageInfo(panel, text) {
  const infoEl = getPanelEl('IMAGE_INFO', panel);
  if (infoEl) {
    infoEl.textContent = text;
  }
}

/**
 * Установить значение селекта директории
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @param {string} value - Значение
 */
export function setDirectorySelectValue(panel, value) {
  const select = getPanelEl('DIR_SELECT', panel);
  if (select) {
    select.value = value;
  }
}

/**
 * Получить текущее значение селекта директории
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @returns {string|null}
 */
export function getDirectorySelectValue(panel) {
  const select = getPanelEl('DIR_SELECT', panel);
  return select ? select.value : null;
}

/**
 * Обновить отображение скорости автопрокрутки
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @param {number} speed - Скорость (секунды)
 */
export function updateSpeedDisplay(panel, speed) {
  const speedValue = getPanelEl('SPEED_VALUE', panel);
  if (speedValue) {
    speedValue.textContent = `${speed}s`;
  }
}

// ============================================
// Universal functions for basket and favorites
// ============================================

/**
 * Get panel state from global variables
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {Object} leftState - Left panel state
 * @param {Object} rightState - Right panel state
 * @returns {Object} - Panel state object
 */
export function getPanelState(panel, leftState, rightState) {
  return panel === PANEL.LEFT ? leftState : rightState;
}

/**
 * Move image to basket (universal function)
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {string} filePath - File path to move
 * @returns {Promise<Object>} - Result with success status and new path
 */
export async function moveToBasket(panel, filePath) {
  const normalizedPath = normalizePath(filePath);
  console.log(`Move to basket (${panel}):`, filePath, '->', normalizedPath);

  try {
    const response = await fetch(API_ENDPOINTS.MOVE_TO_BASKET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: normalizedPath })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`Moved to basket (${panel}):`, result.newPath);
      return { success: true, newPath: result.newPath };
    } else {
      console.error(`Move to basket failed (${panel}):`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`Move to basket error (${panel}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Add image to favorites (universal function)
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {string} filePath - File path to add
 * @returns {Promise<Object>} - Result with success status and new path
 */
export async function addToFavorites(panel, filePath) {
  const normalizedPath = normalizePath(filePath);
  console.log(`Add to favorites (${panel}):`, filePath, '->', normalizedPath);

  try {
    const response = await fetch(UI_IDS.ADD_TO_FAVORITES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: normalizedPath })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`Added to favorites (${panel}):`, result.newPath);
      return { success: true, newPath: result.newPath };
    } else {
      console.error(`Add to favorites failed (${panel}):`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`Add to favorites error (${panel}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 */
export function showNotification(message) {
  // Remove existing notification if any
  const existing = document.getElementById('favoriteNotification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'favoriteNotification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: rgba(0, 128, 0, 0.9);
    color: white;
    border-radius: 8px;
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: fadeInOut 3s ease-in-out;
  `;

  // Add CSS for animation
  if (!document.getElementById('favoriteNotificationStyle')) {
    const style = document.createElement('style');
    style.id = 'favoriteNotificationStyle';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        90% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.getElementById('favoriteNotification')) {
      notification.remove();
    }
  }, 3000);
}

/**
 * Move image to basket and update panel state
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {Array} imageList - Image list array (passed by reference)
 * @param {number} currentIndex - Current image index
 * @param {string} filePath - File path to move
 * @returns {Promise<Object>} - Result with success status
 */
export async function handleMoveToBasket(panel, imageList, currentIndex, filePath) {
  if (imageList.length === 0 || currentIndex < 0) return { success: false };

  const result = await moveToBasket(panel, filePath);

  if (result.success) {
    // Remove from current list
    imageList.splice(currentIndex, 1);

    // If list is empty, return empty status
    if (imageList.length === 0) {
      return { success: true, empty: true };
    }

    // Show next image (wrap around if needed)
    const newIndex = currentIndex >= imageList.length ? 0 : currentIndex;
    return { success: true, newIndex };
  }

  return { success: false, error: result.error };
}

/**
 * Add image to favorites and show notification
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {string} filePath - File path to add
 * @returns {Promise<Object>} - Result with success status
 */
export async function handleAddToFavorites(panel, filePath) {
  const result = await addToFavorites(panel, filePath);

  if (result.success) {
    showNotification('Added to favorites');
  } else {
    alert(`Error: ${result.error || 'Failed to add to favorites'}`);
  }

  return result;
}
