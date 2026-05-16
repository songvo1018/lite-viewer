// ============================================
// UI Element IDs - вынесены в константы
// ============================================

export const UI_IDS = {
  // Left panel
  LEFT_PANEL: 'leftPanel',
  DIR_SELECT_LEFT: 'dirSelectLeft',
  MEDIA_WRAPPER_LEFT: 'mediaWrapperLeft',
  IMAGE_INFO_LEFT: 'imageInfoLeft',
  PREV_BTN_LEFT: 'prevBtnLeft',
  NEXT_BTN_LEFT: 'nextBtnLeft',
  TRASH_BTN_LEFT: 'trashBtnLeft',
  INFO_BTN_LEFT: 'infoBtnLeft',
  RENAME_BTN_LEFT: 'renameBtnLeft',
  AUTO_ROTATE_CHECK_LEFT: 'autoRotateCheckLeft',
  SPEED_RANGE_LEFT: 'speedRangeLeft',
  SPEED_VALUE_LEFT: 'speedValueLeft',

  // Right panel
  RIGHT_PANEL: 'rightPanel',
  DIR_SELECT_RIGHT: 'dirSelectRight',
  MEDIA_WRAPPER_RIGHT: 'mediaWrapperRight',
  IMAGE_INFO_RIGHT: 'imageInfoRight',
  PREV_BTN_RIGHT: 'prevBtnRight',
  NEXT_BTN_RIGHT: 'nextBtnRight',
  TRASH_BTN_RIGHT: 'trashBtnRight',
  INFO_BTN_RIGHT: 'infoBtnRight',
  RENAME_BTN_RIGHT: 'renameBtnRight',
  AUTO_ROTATE_CHECK_RIGHT: 'autoRotateCheckRight',
  SPEED_RANGE_RIGHT: 'speedRangeRight',
  SPEED_VALUE_RIGHT: 'speedValueRight',

  // Shared elements
  SPLITTER: 'splitter',
  INFO_MODAL: 'infoModal',
  RENAME_MODAL: 'renameModal',
  CURRENT_DIR_NAME: 'currentDirName',
  NEW_DIR_NAME: 'newDirName',
  CONFIRM_RENAME: 'confirmRename',
  CANCEL_RENAME: 'cancelRename',
  IP_LIST: 'ipList',
  SHARED_RECURSIVE_MODE_CHECK: 'sharedRecursiveModeCheck',
  INFO_PANEL: 'infoPanel',
  CLOSE_INFO_PANEL: 'closeInfoPanel',
  SHUFFLE_CHECK: 'shuffleCheck',
  // Modal close button (CSS selector .close, not ID)
  MODAL_CLOSE_BUTTON: 'close',
  // Logs window elements
  CLEAR_LOGS_BUTTON: 'clearBtn',
  COPY_LOGS_BUTTON: 'copyBtn',
  API_STATUS: 'apiStatus',
  VITE_STATUS: 'viteStatus',
  NOTIFICATION_CONTAINER: 'notificationContainer',
  // Additional elements from HTML
  SPEED_RANGE: 'speedRange',
  AUTO_ROTATE_CHECK: 'autoRotateCheck',
  FAVORITE_NOTIFICATION: 'favoriteNotification',
  
  // Speed range for both panels (for global settings)
  GLOBAL_SPEED_RANGE: 'speedRange',
  
  // Buttons by type (for iteration)
  NAV_PREV: 'prevBtn',
  NAV_NEXT: 'nextBtn',
  NAV_TRASH: 'trashBtn',
  NAV_INFO: 'infoBtn',
  NAV_RENAME: 'renameBtn',

  // Modal close button (CSS selector .close, not ID)
  MODAL_CLOSE_BUTTON: 'close',
  // Logs window elements
  CLEAR_LOGS_BUTTON: 'clearBtn',
  COPY_LOGS_BUTTON: 'copyBtn',
  API_STATUS: 'apiStatus',
  VITE_STATUS: 'viteStatus',
  NOTIFICATION_CONTAINER: 'notificationContainer',
  // Additional elements from HTML
  SPEED_RANGE: 'speedRange',
  AUTO_ROTATE_CHECK: 'autoRotateCheck',
  FAVORITE_NOTIFICATION: 'favoriteNotification',

  // Speed range for both panels (for global settings)
  GLOBAL_SPEED_RANGE: 'speedRange',
};

// ============================================
// Panel-specific element suffixes
// ============================================

export const PANEL_SUFFIX = {
  LEFT: 'Left',
  RIGHT: 'Right',
};

// ============================================
// Panel identifiers for reusable functions
// ============================================

export const PANEL = {
  LEFT: 'left',
  RIGHT: 'right',
};

// ============================================
// Get element ID based on panel
// ============================================

/**
 * Get element ID for specific panel
 * @param {string} baseId - Base ID without suffix (e.g., 'MEDIA_WRAPPER')
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @returns {string} - Full element ID
 */
export function getPanelElementId(baseId, panel) {
  const suffix = panel === PANEL.LEFT ? 'Left' : 'Right';
  return `${baseId}_${suffix}`; // Используем подчеркивание для единообразия
}

/**
 * Get panel-specific element ID using constant name
 * @param {string} constantName - Name of the constant without suffix (e.g., 'MEDIA_WRAPPER')
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @returns {string} - Full element ID
 */
export function getPanelId(constantName, panel) {
  const suffix = panel === PANEL.LEFT ? 'Left' : 'Right';
  return UI_IDS[`${constantName}_${suffix}`];
}

/**
 * Get all element IDs for a panel
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @returns {Object} - Object with all panel element IDs
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

// ============================================
// Keyboard shortcuts configuration
// ============================================

export const KEYBOARD_SHORTCUTS = {
  PREVIOUS_LEFT: ['ArrowLeft', 'a', 'A', 'ф', 'Ф'],
  NEXT_RIGHT: ['ArrowRight', 'd', 'D', 'ж', 'В'],
  TOGGLE_AUTO_ROTATE_LEFT: ['q', 'Q', 'й', 'Й'],
  TOGGLE_AUTO_ROTATE_RIGHT: ['e', 'E', 'ц', 'Ц'],
  PAUSE_RESUME: [' '],
  MOVE_TO_LEFT_BASKET: ['z', 'Z', 'я', 'Я'],
  MOVE_TO_RIGHT_BASKET: ['c', 'C', 'с', 'С'],
  ADD_TO_FAVORITES_LEFT: ['1'],
  ADD_TO_FAVORITES_RIGHT: ['3'],
  HIDE_VIEWER: ['Escape'],
};

// ============================================
// File extensions
// ============================================

export const FILE_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  videos: ['.mp4'],
};

// ============================================
// Directories
// ============================================

export const DIRECTORIES = {
  BASKET: 'basket',
  FAVORITES: 'favorites',
};

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  DIRECTORIES: '/api/directories',
  IMAGES: '/api/images',
  RENAME_DIRECTORY: '/api/rename-directory',
  MOVE_TO_BASKET: '/api/move-to-basket',
  ADD_TO_FAVORITES: '/api/add-to-favorites',
  IPS: '/api/ips',
};
