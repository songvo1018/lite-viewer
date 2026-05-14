import { PANEL, UI_IDS } from './consts.js';
import { 
  getPanelEl, 
  normalizePath, 
  getFileName, 
  wrapIndex, 
  isVideoFile,
  clearMediaWrapper,
  updateImageInfo,
  updateSpeedDisplay,
} from './utils.js';

// ============================================
// Общая логика для обеих панелей
// ============================================

/**
 * Общая функция загрузки изображений для панели
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @param {string} directory - Путь к директории
 * @param {Object} panelState - Объект состояния панели (ссылка на внешнее состояние)
 * @returns {Promise<void>}
 */
export async function loadImagesForPanel(panel, directory, panelState) {
  const normalizedDir = normalizePath(directory);
  console.log(`loadImagesForPanel(${panel}) called with directory:`, directory, '->', normalizedDir);

  try {
    const response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${panelState.sharedRecursiveMode}`);
    const responseText = await response.clone().text();
    console.log(`Images API response (${panel}):`, response.status, responseText.substring(0, 200));

    if (!response.ok) throw new Error('Failed to load images');
    
    const images = await response.json();
    console.log(`${panel}ImageList loaded:`, images.length, 'items');

    // Обновить состояние
    panelState.imageList = images;
    
    if (images.length > 0) {
      panelState.currentIndex = 0;
      showImageForPanel(panel, panelState);
    } else {
      console.warn(`No images found in ${panel} directory`);
      updateImageInfo(panel, 'No files found in this directory');
      clearMediaWrapper(panel);
    }
  } catch (error) {
    console.error(`Error loading files (${panel}):`, error);
    updateImageInfo(panel, `Error: ${error.message}`);
    clearMediaWrapper(panel);
  }
}

/**
 * Общая функция отображения изображения для панели
 * @param {string} panel - PANEL.LEFT или PANEL.RIGHT
 * @param {Object} panelState - Объект состояния панели
 * @param {number} index - Индекс изображения
 * @param {boolean} isAutoRotate - Вызвано автопрокруткой
 */
export function showImageForPanel(panel, panelState, index, isAutoRotate = false) {
  const { imageList, currentIndex, autoRotateEnabled, autoRotateSpeed, videoElement, waitingForVideo } = panelState;
  
  console.log(`showImageForPanel(${panel}) called with index:`, index, 'imageList.length:', imageList.length);
  
  if (imageList.length === 0) {
    console.warn(`${panel} imageList is empty`);
    return;
  }

  // Обернуть индекс
  index = wrapIndex(index, imageList.length);
  panelState.currentIndex = index;

  const filePath = imageList[index];
  const fileName = getFileName(filePath);
  console.log(`Displaying (${panel}):`, filePath, 'as', fileName);

  // Очистить предыдущее содержимое
  clearMediaWrapper(panel);

  // Остановить автопрокрутку при ручном переключении
  if (!isAutoRotate && panelState.autoRotateInterval) {
    clearInterval(panelState.autoRotateInterval);
    panelState.autoRotateInterval = null;
  }

  // Проверить тип файла
  if (isVideoFile(filePath)) {
    showVideoForPanel(panel, filePath, panelState, isAutoRotate);
  } else {
    showImageFileForPanel(panel, filePath, panelState);
  }

  // Обновить информацию
  const infoText = `${panel === PANEL.LEFT ? 'Left' : 'Right'}: ${index + 1} / ${imageList.length} - ${fileName}`;
  updateImageInfo(panel, infoText);
}

/**
 * Показать видео для панели
 */
function showVideoForPanel(panel, filePath, panelState, isAutoRotate) {
  const { autoRotateEnabled, autoRotateInterval } = panelState;
  
  const wrapper = getPanelEl('MEDIA_WRAPPER', panel);
  if (!wrapper) return;

  wrapper.innerHTML = `<video src="${filePath}?t=${Date.now()}" controls style="max-width: 100%; max-height: 100%;"></video>`;

  const video = wrapper.querySelector('video');
  panelState.videoElement = video;
  panelState.waitingForVideo = true;

  // Обработчик окончания видео
  video.addEventListener('ended', () => {
    console.log(`${panel} video ended, showing next image`);
    panelState.waitingForVideo = false;
    panelState.videoElement = null;
    showImageForPanel(panel, panelState, panelState.currentIndex + 1, true);
  });

  // Остановить интервал автопрокрутки
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
    panelState.autoRotateInterval = null;
  }

  // Запустить автопрокрутку если включена
  if (autoRotateEnabled && !isAutoRotate) {
    startAutoRotateForPanel(panel, panelState);
  }
}

/**
 * Показать изображение для панели
 */
function showImageFileForPanel(panel, filePath, panelState) {
  const { autoRotateEnabled, autoRotateInterval } = panelState;
  
  const wrapper = getPanelEl('MEDIA_WRAPPER', panel);
  if (!wrapper) return;

  const img = document.createElement('img');
  img.src = `${filePath}?t=${Date.now()}`;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.objectFit = 'contain';
  img.style.display = 'block';
  img.style.width = '100%';
  wrapper.appendChild(img);

  // Сбросить состояние видео
  panelState.videoElement = null;
  panelState.waitingForVideo = false;

  // Запустить автопрокрутку если включена
  if (autoRotateEnabled && !panelState.autoRotateInterval) {
    startAutoRotateForPanel(panel, panelState);
  }
}

/**
 * Запустить автопрокрутку для панели
 */
export function startAutoRotateForPanel(panel, panelState) {
  const { autoRotateEnabled, imageList, autoRotateInterval, waitingForVideo, videoElement, autoRotateSpeed } = panelState;

  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
  }

  if (autoRotateEnabled && imageList.length > 0) {
    if (waitingForVideo && videoElement) {
      return;
    }

    panelState.autoRotateInterval = setInterval(() => {
      showImageForPanel(panel, panelState, panelState.currentIndex + 1, true);
    }, autoRotateSpeed * 1000);
  }
}

/**
 * Остановить автопрокрутку для панели
 */
export function stopAutoRotateForPanel(panel, panelState) {
  if (panelState.autoRotateInterval) {
    clearInterval(panelState.autoRotateInterval);
    panelState.autoRotateInterval = null;
  }
}

/**
 * Остановить автопрокрутку для обеих панелей
 */
export function stopAutoRotateForAll(leftState, rightState) {
  stopAutoRotateForPanel(PANEL.LEFT, leftState);
  stopAutoRotateForPanel(PANEL.RIGHT, rightState);
}
