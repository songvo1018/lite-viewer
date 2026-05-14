import { PANEL, getPanelEl, normalizePath, getFileName, wrapIndex, isVideoFile } from './utils.js';
import { getEl } from './consts.js';

/**
 * Create a panel controller module
 * @param {string} panel - PANEL.LEFT or PANEL.RIGHT
 * @param {Object} options - Configuration options
 * @returns {Object} - Panel controller methods
 */
export function createPanelController(panel, options = {}) {
  const {
    imageList = [],
    currentIndex = 0,
    directoryPath = '',
    autoRotateEnabled = false,
    autoRotateSpeed = 2,
  } = options;

  // State
  let state = {
    imageList,
    currentIndex,
    directoryPath,
    autoRotateEnabled,
    autoRotateSpeed,
    autoRotateInterval: null,
    videoElement: null,
    waitingForVideo: false,
  };

  // Get panel-specific element IDs
  const ids = {
    PANEL: panel,
    MEDIA_WRAPPER: getPanelEl('MEDIA_WRAPPER', panel),
    IMAGE_INFO: getPanelEl('IMAGE_INFO', panel),
    PREV_BTN: getPanelEl('PREV_BTN', panel),
    NEXT_BTN: getPanelEl('NEXT_BTN', panel),
    TRASH_BTN: getPanelEl('TRASH_BTN', panel),
    INFO_BTN: getPanelEl('INFO_BTN', panel),
    RENAME_BTN: getPanelEl('RENAME_BTN', panel),
    AUTO_ROTATE_CHECK: getEl(`autoRotateCheck${panel === PANEL.LEFT ? 'Left' : 'Right'}`),
    SPEED_RANGE: getEl(`speedRange${panel === PANEL.LEFT ? 'Left' : 'Right'}`),
    SPEED_VALUE: getEl(`speedValue${panel === PANEL.LEFT ? 'Left' : 'Right'}`),
  };

  /**
   * Update the speed value display
   */
  function updateSpeedDisplay() {
    if (ids.SPEED_VALUE) {
      ids.SPEED_VALUE.textContent = `${state.autoRotateSpeed}s`;
    }
  }

  /**
   * Clear the media wrapper
   */
  function clearMedia() {
    if (ids.MEDIA_WRAPPER) {
      ids.MEDIA_WRAPPER.innerHTML = '';
    }
  }

  /**
   * Stop auto-rotate interval
   */
  function stopAutoRotateInterval() {
    if (state.autoRotateInterval) {
      clearInterval(state.autoRotateInterval);
      state.autoRotateInterval = null;
    }
  }

  /**
   * Start auto-rotate
   */
  function startAutoRotate() {
    stopAutoRotateInterval();

    if (state.autoRotateEnabled && state.imageList.length > 0) {
      if (state.waitingForVideo && state.videoElement) {
        return;
      }

      state.autoRotateInterval = setInterval(() => {
        showImage(state.currentIndex + 1, true);
      }, state.autoRotateSpeed * 1000);
    }
  }

  /**
   * Show image at specific index
   * @param {number} index - Image index
   * @param {boolean} isAutoRotate - Whether triggered by auto-rotate
   */
  function showImage(index, isAutoRotate = false) {
    console.log(`showImage(${panel}) called with index:`, index, 'imageList.length:', state.imageList.length);
    
    if (state.imageList.length === 0) {
      console.warn(`${panel} imageList is empty`);
      return;
    }

    // Wrap index
    index = wrapIndex(index, state.imageList.length);
    state.currentIndex = index;

    const filePath = state.imageList[state.currentIndex];
    const fileName = getFileName(filePath);
    console.log(`Displaying (${panel}):`, filePath, 'as', fileName);

    // Clear previous content
    clearMedia();

    // Stop auto-rotate only if manually navigating
    if (!isAutoRotate) {
      stopAutoRotateInterval();
    }

    // Check if video
    const isVideo = isVideoFile(filePath);

    if (isVideo) {
      showVideo(filePath);
    } else {
      showImageFile(filePath);
    }

    // Update info
    const infoText = `${panel.charAt(0).toUpperCase() + panel.slice(1)}: ${state.currentIndex + 1} / ${state.imageList.length} - ${fileName}`;
    updateImageInfo(panel, infoText);
  }

  /**
   * Display video element
   */
  function showVideo(filePath) {
    if (!ids.MEDIA_WRAPPER) return;

    ids.MEDIA_WRAPPER.innerHTML = `<video autoplay src="${filePath}?t=${Date.now()}" controls style="max-width: 100%; max-height: 100%;"></video>`;

    state.videoElement = ids.MEDIA_WRAPPER.querySelector('video');

    if (state.autoRotateEnabled && !state.waitingForVideo) {
      state.waitingForVideo = true;

      state.videoElement.addEventListener('ended', () => {
        console.log(`${panel} video ended, showing next image`);
        state.waitingForVideo = false;
        state.videoElement = null;
        showImage(state.currentIndex + 1, true);
      });

      stopAutoRotateInterval();
    }
  }

  /**
   * Display image element
   */
  function showImageFile(filePath) {
    if (!ids.MEDIA_WRAPPER) return;

    const img = document.createElement('img');
    img.src = `${filePath}?t=${Date.now()}`;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.width = '100%';
    ids.MEDIA_WRAPPER.appendChild(img);

    // Reset video tracking
    state.videoElement = null;
    state.waitingForVideo = false;

    // Restart auto-rotate for images
    if (state.autoRotateEnabled && !state.autoRotateInterval) {
      startAutoRotate();
    }
  }

  /**
   * Update image list
   */
  function updateImageList(newList) {
    state.imageList = newList || [];
    if (state.imageList.length > 0 && state.currentIndex >= state.imageList.length) {
      state.currentIndex = 0;
    }
  }

  /**
   * Move current image to basket (to be implemented by caller)
   */
  async function moveToBasket() {
    // Implementation depends on API
  }

  /**
   * Add current image to favorites (to be implemented by caller)
   */
  async function addToFavorites() {
    // Implementation depends on API
  }

  // Return public methods
  return {
    get state() { return state; },
    get ids() { return ids; },
    showImage,
    stopAutoRotateInterval,
    startAutoRotate,
    updateImageList,
    clearMedia,
    moveToBasket,
    addToFavorites,
    updateSpeedDisplay,
  };
}
