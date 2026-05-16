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
import { showImageForPanel, startAutoRotateForPanel, stopAutoRotateForPanel, stopAutoRotateForAll } from './panelLogic.js';

// Configuration loaded from app-config.json
let appConfig = null;

// Load configuration from app-config.json
async function loadAppConfig() {
  try {
    const response = await fetch('/app-config.json');
    if (response.ok) {
      appConfig = await response.json();
      console.log('App config loaded:', appConfig);
      return appConfig;
    }
  } catch (error) {
    console.warn('Could not load app-config.json, using defaults:', error);
  }
  // Return default config if loading fails
  return {
    keyboardShortcuts: {
      previousLeft: { description: "Previous image (left panel)", keys: ["ArrowLeft", "a", "A", "ф", "Ф"] },
      nextRight: { description: "Next image (right panel)", keys: ["ArrowRight", "d", "D", "ж", "В"] },
      toggleAutoRotateLeft: { description: "Toggle auto-rotate (left panel)", keys: ["q", "Q", "й", "Й"] },
      toggleAutoRotateRight: { description: "Toggle auto-rotate (right panel)", keys: ["e", "E", "ц", "Ц"] },
      pauseResumeCurrent: { description: "Pause/Resume current panel's auto-rotate", keys: [" "] },
      moveToLeftBasket: { description: "Move current image from left panel to basket", keys: ["z", "Z", "я", "Я"] },
      moveToRightBasket: { description: "Move current image from right panel to basket", keys: ["c", "C", "с", "С"] },
      hideViewer: { description: "Hide media viewer", keys: ["Escape"] }
    },
    autoRotate: { defaultSpeed: 2, minSpeed: 1, maxSpeed: 10, speedUnit: "seconds" },
    basket: { directoryName: "basket" },
    fileExtensions: {
      images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"],
      videos: [".mp4"]
    },
    shuffleOrder: { enabled: false }
  };
}

// Get config value with path (e.g., "keyboardShortcuts.previousLeft")
function getConfig(path) {
  if (!appConfig) return null;
  const keys = path.split('.');
  let value = appConfig;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return null;
  }
  return value;
}

// Splitter state
let isDragging = false;
let startX = 0;
let startWidthLeft = 50;

// DOM elements for left viewer (using getEl for caching)
const mediaWrapperLeft = getEl(UI_IDS.MEDIA_WRAPPER_LEFT);
const imageInfoLeft = getEl(UI_IDS.IMAGE_INFO_LEFT);
const prevBtnLeft = getEl(UI_IDS.PREV_BTN_LEFT);
const nextBtnLeft = getEl(UI_IDS.NEXT_BTN_LEFT);
const dirSelectLeft = getEl(UI_IDS.DIR_SELECT_LEFT);
const trashBtnLeft = getEl(UI_IDS.TRASH_BTN_LEFT);
const renameBtnLeft = getEl(UI_IDS.RENAME_BTN_LEFT);
const autoRotateCheckLeft = getEl(UI_IDS.AUTO_ROTATE_CHECK_LEFT);
const speedRangeLeft = getEl(UI_IDS.SPEED_RANGE_LEFT);
const speedValueLeft = getEl(UI_IDS.SPEED_VALUE_LEFT);

// DOM elements for right viewer (using getEl for caching)
const mediaWrapperRight = getEl(UI_IDS.MEDIA_WRAPPER_RIGHT);
const imageInfoRight = getEl(UI_IDS.IMAGE_INFO_RIGHT);
const prevBtnRight = getEl(UI_IDS.PREV_BTN_RIGHT);
const nextBtnRight = getEl(UI_IDS.NEXT_BTN_RIGHT);
const dirSelectRight = getEl(UI_IDS.DIR_SELECT_RIGHT);
const trashBtnRight = getEl(UI_IDS.TRASH_BTN_RIGHT);
const renameBtnRight = getEl(UI_IDS.RENAME_BTN_RIGHT);
const autoRotateCheckRight = getEl(UI_IDS.AUTO_ROTATE_CHECK_RIGHT);
const speedRangeRight = getEl(UI_IDS.SPEED_RANGE_RIGHT);
const speedValueRight = getEl(UI_IDS.SPEED_VALUE_RIGHT);

// Splitter element
const splitter = getEl(UI_IDS.SPLITTER);

// Info panel elements
const infoPanel = getEl(UI_IDS.INFO_PANEL);
const infoBtnLeft = getEl(UI_IDS.INFO_BTN_LEFT);
const infoBtnRight = getEl(UI_IDS.INFO_BTN_RIGHT);
const closeInfoPanelBtn = getEl(UI_IDS.CLOSE_INFO_PANEL);
const infoModal = getEl(UI_IDS.INFO_MODAL);
const renameModal = getEl(UI_IDS.RENAME_MODAL);
const currentDirNameEl = getEl(UI_IDS.CURRENT_DIR_NAME);
const newDirNameInput = getEl(UI_IDS.NEW_DIR_NAME);
const confirmRenameBtn = getEl(UI_IDS.CONFIRM_RENAME);
const cancelRenameBtn = getEl(UI_IDS.CANCEL_RENAME);
const sharedRecursiveModeCheckbox = getEl(UI_IDS.SHARED_RECURSIVE_MODE_CHECK);
const shuffleCheckbox = getEl(UI_IDS.SHUFFLE_CHECK);

// Current state for both viewers
let leftImageList = [];
let rightImageList = [];
let leftCurrentIndex = 0;
let rightCurrentIndex = 0;
let leftDirectoryPath = '';
let rightDirectoryPath = '';

// Auto-rotate state for each panel
let leftAutoRotateEnabled = false;
let rightAutoRotateEnabled = false;
let leftAutoRotateInterval = null;
let rightAutoRotateInterval = null;
let leftAutoRotateSpeed = 2; // Default 2 seconds
let rightAutoRotateSpeed = 2; // Default 2 seconds

// Shuffle state
let isShuffleEnabled = false;

// Track current video elements for auto-rotate
let leftVideoElement = null;
let rightVideoElement = null;
let leftWaitingForVideo = false;
let rightWaitingForVideo = false;

// Update timer display
function updateTimerDisplay() {
  const speedValueLeft = document.getElementById('speedValueLeft');
  if (speedValueLeft) {
    speedValueLeft.textContent = `${leftAutoRotateSpeed}s`;
  }

  const speedValueRight = document.getElementById('speedValueRight');
  if (speedValueRight) {
    speedValueRight.textContent = `${rightAutoRotateSpeed}s`;
  }
}

// Update speed from config after it loads
function updateSpeedFromConfig() {
  const autoRotateConfig = getConfig('autoRotate');
  if (autoRotateConfig && autoRotateConfig.defaultSpeed) {
    leftAutoRotateSpeed = autoRotateConfig.defaultSpeed;
    rightAutoRotateSpeed = autoRotateConfig.defaultSpeed;
    updateTimerDisplay();
  }
}

// Start auto-rotate for left panel
function startLeftAutoRotate() {
  if (leftAutoRotateInterval) {
    clearInterval(leftAutoRotateInterval);
  }

  if (leftAutoRotateEnabled && leftImageList.length > 0) {
    // If waiting for video to end, don't start interval yet
    if (leftWaitingForVideo && leftVideoElement) {
      return;
    }
    
    leftAutoRotateInterval = setInterval(() => {
      showImageLeft(leftCurrentIndex + 1, true);
    }, leftAutoRotateSpeed * 1000);
  }
}

// Start auto-rotate for right panel
function startRightAutoRotate() {
  if (rightAutoRotateInterval) {
    clearInterval(rightAutoRotateInterval);
  }

  if (rightAutoRotateEnabled && rightImageList.length > 0) {
    // If waiting for video to end, don't start interval yet
    if (rightWaitingForVideo && rightVideoElement) {
      return;
    }
    
    rightAutoRotateInterval = setInterval(() => {
      showImageRight(rightCurrentIndex + 1, true);
    }, rightAutoRotateSpeed * 1000);
  }
}

// Stop auto-rotate for both panels
function stopAutoRotate() {
  if (leftAutoRotateInterval) {
    clearInterval(leftAutoRotateInterval);
    leftAutoRotateInterval = null;
  }
  if (rightAutoRotateInterval) {
    clearInterval(rightAutoRotateInterval);
    rightAutoRotateInterval = null;
  }
  // Reset video tracking
  leftVideoElement = null;
  rightVideoElement = null;
  leftWaitingForVideo = false;
  rightWaitingForVideo = false;
}

// Auto-rotate images for both panels
function startAutoRotate() {
  stopAutoRotate();
  startLeftAutoRotate();
  startRightAutoRotate();
}

// Load IP addresses from API
async function loadIPs() {
  try {
    const response = await fetch('/api/ips');
    if (response.ok) {
      const ips = await response.json();
      const ipList = document.getElementById('ipList');
      if (ipList) {
        ipList.innerHTML = ips.map(ip => `<div class="ip-item">${ip}:3000</div>`).join('');
      }
    } else {
      const ipList = document.getElementById('ipList');
      if (ipList) {
        ipList.innerHTML = '<div class="ip-item">Unable to fetch IPs</div>';
      }
    }
  } catch (error) {
    const ipList = document.getElementById('ipList');
    if (ipList) {
      ipList.innerHTML = '<div class="ip-item">192.168.x.x:3000</div><div class="ip-item">Access API on port 3000</div>';
    }
  }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === infoModal) {
    infoModal.classList.toggle("hidden");
  }
  if (e.target === renameModal) {
    renameModal.style.display = 'none';
  }
});

// // Event listeners for info button (left panel) - toggle info panel
// if (infoBtnLeft) {
//   infoBtnLeft.addEventListener('click', () => toggleInfoPanel());
// }

// // Event listeners for info button (right panel) - toggle info panel
// if (infoBtnRight) {
//   infoBtnRight.addEventListener('click', () => toggleInfoPanel());
// }

// Close modal when clicking close button
const closeBtn = document.querySelector('.close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    infoModal.classList.toggle("hidden");
    renameModal.style.display = 'none';
  });
}

// Rename button for left panel
if (renameBtnLeft) {
  renameBtnLeft.addEventListener('click', () => {
    console.log('Rename button clicked (left), currentDirectoryPath:', leftDirectoryPath);
    if (leftDirectoryPath) {
      renameModal.style.display = 'block';
      currentDirNameEl.textContent = leftDirectoryPath.split('/').pop() || leftDirectoryPath;
      newDirNameInput.value = '';
      newDirNameInput.focus();
    } else {
      console.warn('leftDirectoryPath is empty!');
    }
  });
}

// Rename button for right panel
if (renameBtnRight) {
  renameBtnRight.addEventListener('click', () => {
    console.log('Rename button clicked (right), currentDirectoryPath:', rightDirectoryPath);
    if (rightDirectoryPath) {
      renameModal.style.display = 'block';
      currentDirNameEl.textContent = rightDirectoryPath.split('/').pop() || rightDirectoryPath;
      newDirNameInput.value = '';
      newDirNameInput.focus();
    } else {
      console.warn('rightDirectoryPath is empty!');
    }
  });
}

if (confirmRenameBtn) {
  confirmRenameBtn.addEventListener('click', async () => {
    try {
      console.log('confirmRenameBtn clicked');
      const newName = newDirNameInput.value.trim();
      console.log('New name:', JSON.stringify(newName));

      if (!newName) {
        console.warn('New name is empty');
        return;
      }

      // Normalize currentDirectoryPath: replace backslashes with forward slashes
      // We'll use the left panel directory for rename (as it was in original implementation)
      const normalizedOldPath = leftDirectoryPath.replace(/\\/g, '/');
      console.log('Rename attempt:', {
        leftDirectoryPath,
        normalizedOldPath,
        newPath: newName
      });

      const response = await fetch('/api/rename-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath: normalizedOldPath,
          newPath: newName
        })
      });

      console.log('Rename response:', response.status, await response.clone().text());

      if (response.ok) {
        const result = await response.json();
        renameModal.style.display = 'none';
        newDirNameInput.value = '';

        // Update leftDirectoryPath to the new name
        leftDirectoryPath = newName.replace(/\\/g, '/');
        leftCurrentIndex = 0;

        // Reload directories to show the renamed directory
        loadDirectories();
        // Update the select to show the renamed directory
        setTimeout(() => {
          dirSelectLeft.value = leftDirectoryPath;
          loadImagesLeft(leftDirectoryPath);

          // Update URL to reflect the renamed directory
          const url = new URL(window.location);
          url.searchParams.set('dirLeft', leftDirectoryPath);
          window.history.pushState({}, '', url);
        }, 300);
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Failed to rename directory';
        const debugInfo = error.requestedPath || error.fullSearchPath || error.details
          ? `\n\nDebug: ${JSON.stringify(error, null, 2)}`
          : '';
        console.error('Rename error response:', errorMsg, debugInfo);
        alert(`Error: ${errorMsg}${debugInfo}`);
      }
    } catch (error) {
      console.error('Rename exception:', error);
      alert('Error: ' + error.message);
    }
  });
}

if (cancelRenameBtn) {
  cancelRenameBtn.addEventListener('click', () => {
    renameModal.style.display = 'none';
    newDirNameInput.value = '';
  });
}

// Load directory list on startup
async function loadDirectories() {
  // Give API server time to start
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const response = await fetch(`/api/directories`);
    console.log('Directories API response:', response.status, await response.clone().text());

    if (!response.ok) {
      if (response.status === 502) {
        throw new Error('Could not connect to API server. Make sure the Electron app is running.');
      }
      throw new Error('Failed to load directories');
    }
    const directories = await response.json();
    console.log('Directories:', directories);

    if (directories.length > 0) {
      // Update left select
      dirSelectLeft.innerHTML = directories
        .map(dir => `<option value="${dir.path}">${dir.name}</option>`)
        .join('');

      // Update right select
      dirSelectRight.innerHTML = directories
        .map(dir => `<option value="${dir.path}">${dir.name}</option>`)
        .join('');

      // Set selected directory from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const dirLeftParam = urlParams.get('dirLeft') || directories[0].path;
      const dirRightParam = urlParams.get('dirRight') || (directories.length > 1 ? directories[1].path : directories[0].path);

      dirSelectLeft.value = dirLeftParam;
      dirSelectRight.value = dirRightParam;

      leftDirectoryPath = dirLeftParam;
      rightDirectoryPath = dirRightParam;

      loadImagesLeft(dirLeftParam);
      loadImagesRight(dirRightParam);
    } else {
      dirSelectLeft.innerHTML = '<option value=".">No directories found</option>';
      dirSelectRight.innerHTML = '<option value=".">No directories found</option>';
      leftDirectoryPath = '';
      rightDirectoryPath = '';
      imageInfoLeft.textContent = 'No directories with files found in public/';
      imageInfoRight.textContent = 'No directories with files found in public/';
    }
  } catch (error) {
    console.error('Error loading directories:', error);
    dirSelectLeft.innerHTML = '<option value=".">Error loading directories</option>';
    dirSelectRight.innerHTML = '<option value=".">Error loading directories</option>';
  }
}

// Load image list from server for left viewer
async function loadImagesLeft(directory) {
  // Normalize path: replace backslashes with forward slashes
  const normalizedDir = directory.replace(/\\/g, '/');
  console.log('loadImagesLeft called with directory:', directory, '->', normalizedDir);

  try {
    let response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}&shuffle=${isShuffleEnabled}`);
    const responseText = await response.clone().text();
    console.log('Images API response (left):', response.status, responseText.substring(0, 200));

    if (!response.ok) throw new Error('Failed to load images');
    leftImageList = await response.json();
    console.log('leftImageList loaded:', leftImageList.length, 'items');

    if (leftImageList.length > 0) {
      leftCurrentIndex = 0;
      showImageLeft(leftCurrentIndex);
    } else {
      console.warn('No images found in directory');
      imageInfoLeft.textContent = 'No files found in this directory';
      mediaWrapperLeft.innerHTML = '';
    }
  } catch (error) {
    console.error('Error loading files (left):', error);
    imageInfoLeft.textContent = `Error: ${error.message}`;
    mediaWrapperLeft.innerHTML = '';
  }
}

// Load image list from server for right viewer
async function loadImagesRight(directory) {
  // Normalize path: replace backslashes with forward slashes
  const normalizedDir = directory.replace(/\\/g, '/');
  console.log('loadImagesRight called with directory:', directory, '->', normalizedDir);

  try {
    console.log(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}&shuffle=${isShuffleEnabled}`)
    let response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}&shuffle=${isShuffleEnabled}`);
    const responseText = await response.clone().text();
    console.log('Images API response (right):', response.status, responseText.substring(0, 200));

    if (!response.ok) throw new Error('Failed to load images');
    rightImageList = await response.json();
    console.log('rightImageList loaded:', rightImageList.length, 'items');

    if (rightImageList.length > 0) {
      rightCurrentIndex = 0;
      showImageRight(rightCurrentIndex);
    } else {
      console.warn('No images found in directory');
      imageInfoRight.textContent = 'No files found in this directory';
      mediaWrapperRight.innerHTML = '';
    }
  } catch (error) {
    console.error('Error loading files (right):', error);
    imageInfoRight.textContent = `Error: ${error.message}`;
    mediaWrapperRight.innerHTML = '';
  }
}

// Display current file for left viewer
function showImageLeft(index, isAutoRotate = false) {
  console.log('showImageLeft called with index:', index, 'leftImageList.length:', leftImageList.length);
  if (leftImageList.length === 0) {
    console.warn('leftImageList is empty');
    return;
  }

  // Wrap around
  if (index < 0) index = leftImageList.length - 1;
  if (index >= leftImageList.length) index = 0;

  leftCurrentIndex = index;
  const filePath = leftImageList[leftCurrentIndex];
  const fileName = filePath.split('/').pop();
  console.log('Displaying (left):', filePath, 'as', fileName);

  // Clear previous content
  mediaWrapperLeft.innerHTML = '';

  // Track if auto-rotate was enabled before manual navigation
  const wasAutoRotateEnabled = leftAutoRotateEnabled && leftAutoRotateInterval !== null;

  // Stop auto-rotate only if manually navigating (not from auto-rotate interval)
  if (!isAutoRotate && leftAutoRotateInterval) {
    clearInterval(leftAutoRotateInterval);
    leftAutoRotateInterval = null;
  }

  // Check if it's a video file
  const isVideo = filePath.toLowerCase().endsWith('.mp4');

  if (isVideo) {
    // Display as video element
    mediaWrapperLeft.innerHTML = `<video autoplay src="${filePath}?t=${Date.now()}" controls style="max-width: 100%; max-height: 100%;"></video>`;
    
    // Track video element
    leftVideoElement = mediaWrapperLeft.querySelector('video');
    
    // If auto-rotate is enabled and we're not waiting for another video, 
    // we need to wait for this video to end
    if (leftAutoRotateEnabled && !leftWaitingForVideo) {
      leftWaitingForVideo = true;
      
      // When video ends, automatically show next item
      leftVideoElement.addEventListener('ended', () => {
        console.log('Left video ended, showing next image');
        leftWaitingForVideo = false;
        leftVideoElement = null;
        showImageLeft(leftCurrentIndex + 1, true);
      });
      
      // Also remove the interval if it was set
      if (leftAutoRotateInterval) {
        clearInterval(leftAutoRotateInterval);
        leftAutoRotateInterval = null;
      }
    }
  } else {
    // Display as image
    const img = document.createElement('img');
    img.src = `${filePath}?t=${Date.now()}`;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    mediaWrapperLeft.appendChild(img);
    
    // Reset video tracking for non-video items
    leftVideoElement = null;
    leftWaitingForVideo = false;

    // Restart auto-rotate interval for images if it was enabled before manual navigation
    if (leftAutoRotateEnabled && !leftAutoRotateInterval && wasAutoRotateEnabled) {
      startLeftAutoRotate();
    }
  }

  // Update info
  imageInfoLeft.textContent = `Left: ${leftCurrentIndex + 1} / ${leftImageList.length} - ${fileName}`;
}

// Display current file for right viewer
function showImageRight(index, isAutoRotate = false) {
  console.log('showImageRight called with index:', index, 'rightImageList.length:', rightImageList.length);
  if (rightImageList.length === 0) {
    console.warn('rightImageList is empty');
    return;
  }

  // Wrap around
  if (index < 0) index = rightImageList.length - 1;
  if (index >= rightImageList.length) index = 0;

  rightCurrentIndex = index;
  const filePath = rightImageList[rightCurrentIndex];
  const fileName = filePath.split('/').pop();
  console.log('Displaying (right):', filePath, 'as', fileName);

  // Clear previous content
  mediaWrapperRight.innerHTML = '';

  // Track if auto-rotate was enabled before manual navigation
  const wasAutoRotateEnabled = rightAutoRotateEnabled && rightAutoRotateInterval !== null;

  // Stop auto-rotate only if manually navigating (not from auto-rotate interval)
  if (!isAutoRotate && rightAutoRotateInterval) {
    clearInterval(rightAutoRotateInterval);
    rightAutoRotateInterval = null;
  }

  // Check if it's a video file
  const isVideo = filePath.toLowerCase().endsWith('.mp4');

  if (isVideo) {
    // Display as video element
    mediaWrapperRight.innerHTML = `<video src="${filePath}?t=${Date.now()}" controls style="max-width: 100%; max-height: 100%;"></video>`;
    
    // Track video element
    rightVideoElement = mediaWrapperRight.querySelector('video');
    
    // If auto-rotate is enabled and we're not waiting for another video, 
    // we need to wait for this video to end
    if (rightAutoRotateEnabled && !rightWaitingForVideo) {
      rightWaitingForVideo = true;
      
      // When video ends, automatically show next item
      rightVideoElement.addEventListener('ended', () => {
        console.log('Right video ended, showing next image');
        rightWaitingForVideo = false;
        rightVideoElement = null;
        showImageRight(rightCurrentIndex + 1, true);
      });
      
      // Also remove the interval if it was set
      if (rightAutoRotateInterval) {
        clearInterval(rightAutoRotateInterval);
        rightAutoRotateInterval = null;
      }
    }
  } else {
    // Display as image
    const img = document.createElement('img');
    img.src = `${filePath}?t=${Date.now()}`;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    mediaWrapperRight.appendChild(img);
    
    // Reset video tracking for non-video items
    rightVideoElement = null;
    rightWaitingForVideo = false;

    // Restart auto-rotate interval for images if it was enabled before manual navigation
    if (rightAutoRotateEnabled && !rightAutoRotateInterval && wasAutoRotateEnabled) {
      startRightAutoRotate();
    }
  }

  // Update info
  imageInfoRight.textContent = `Right: ${rightCurrentIndex + 1} / ${rightImageList.length} - ${fileName}`;
}

// Check if event key matches config keys
function matchesKeyConfig(event, configPath) {
  const keys = getConfig(configPath);
  if (!keys || !keys.keys) return false;
  return keys.keys.includes(event.key) || keys.keys.includes(event.code);
}

// Keyboard navigation
function handleKeyDown(event) {
  // Suppress navigation if rename modal is open
  if (renameModal && renameModal.style.display === 'block') {
    return;
  }

  // Q/Й: Pause/Resume left panel auto-rotate
  if (matchesKeyConfig(event, 'keyboardShortcuts.toggleAutoRotateLeft')) {
    if (leftAutoRotateInterval) {
      clearInterval(leftAutoRotateInterval);
      leftAutoRotateInterval = null;
    } else if (leftAutoRotateEnabled) {
      startLeftAutoRotate();
    }
  }

  // E/Ц: Pause/Resume right panel auto-rotate
  if (matchesKeyConfig(event, 'keyboardShortcuts.toggleAutoRotateRight')) {
    if (rightAutoRotateInterval) {
      clearInterval(rightAutoRotateInterval);
      rightAutoRotateInterval = null;
    } else if (rightAutoRotateEnabled) {
      startRightAutoRotate();
    }
  }

  // Space: Pause/Resume current panel's auto-rotate (left panel has priority)
  if (matchesKeyConfig(event, 'keyboardShortcuts.pauseResumeCurrent')) {
    event.preventDefault();

    // Pause/Resume left panel
    if (leftAutoRotateInterval) {
      clearInterval(leftAutoRotateInterval);
      leftAutoRotateInterval = null;
    } else if (leftAutoRotateEnabled) {
      startLeftAutoRotate();
    }

    // If left panel is not enabled, try right panel
    else if (rightAutoRotateInterval) {
      clearInterval(rightAutoRotateInterval);
      rightAutoRotateInterval = null;
    } else if (rightAutoRotateEnabled) {
      startRightAutoRotate();
    }
  }

  // Left viewer navigation (A, Left Arrow, Ф)
  if (matchesKeyConfig(event, 'keyboardShortcuts.previousLeft')) {
    if (leftImageList.length > 0) {
      showImageLeft(leftCurrentIndex - 1);
    }
  }

  // Right viewer navigation (D, Right Arrow, Ж, В)
  if (matchesKeyConfig(event, 'keyboardShortcuts.nextRight')) {
    if (rightImageList.length > 0) {
      showImageRight(rightCurrentIndex + 1);
    }
  }

  // Escape to hide info panel or clear media viewer
  if (matchesKeyConfig(event, 'keyboardShortcuts.hideViewer')) {
    if (infoPanel && !infoPanel.classList.contains('hidden')) {
      hideInfoPanel();
      return;
    }
    mediaWrapperLeft.innerHTML = '';
    mediaWrapperRight.innerHTML = '';
  }

  // Z/Я: Move left panel image to basket
  if (matchesKeyConfig(event, 'keyboardShortcuts.moveToLeftBasket')) {
    event.preventDefault();
    moveToLeftBasket();
    return;
  }

  // C/С: Move right panel image to basket
  if (matchesKeyConfig(event, 'keyboardShortcuts.moveToRightBasket')) {
    event.preventDefault();
    moveToRightBasket();
    return;
  }

  // 1: Add left panel image to favorites
  if (matchesKeyConfig(event, 'keyboardShortcuts.addToFavoritesLeft')) {
    event.preventDefault();
    addToFavoritesLeft();
    return;
  }

  // 3: Add right panel image to favorites
  if (matchesKeyConfig(event, 'keyboardShortcuts.addToFavoritesRight')) {
    event.preventDefault();
    addToFavoritesRight();
    return;
  }
}

// Event listeners for left viewer
if (prevBtnLeft) {
  prevBtnLeft.addEventListener('click', () => showImageLeft(leftCurrentIndex - 1));
}
if (nextBtnLeft) {
  nextBtnLeft.addEventListener('click', () => showImageLeft(leftCurrentIndex + 1));
}
if (trashBtnLeft) {
  trashBtnLeft.addEventListener('click', () => moveToLeftBasket());
}

// Event listeners for right viewer
if (prevBtnRight) {
  prevBtnRight.addEventListener('click', () => showImageRight(rightCurrentIndex - 1));
}
if (nextBtnRight) {
  nextBtnRight.addEventListener('click', () => showImageRight(rightCurrentIndex + 1));
}
if (trashBtnRight) {
  trashBtnRight.addEventListener('click', () => moveToRightBasket());
}
if (infoBtnLeft) {
  infoBtnLeft.addEventListener('click', () => toggleInfoModal());
}
if (infoBtnRight) {
  infoBtnRight.addEventListener('click', () => toggleInfoPanel());
}
if (closeInfoPanelBtn) {
  closeInfoPanelBtn.addEventListener('click', () => hideInfoPanel());
}

// Directory change handlers
dirSelectLeft.addEventListener('change', (e) => {
  const newDir = e.target.value;
  console.log('Left directory changed to:', newDir);
  leftDirectoryPath = newDir;
  const url = new URL(window.location);
  url.searchParams.set('dirLeft', newDir);
  window.history.pushState({}, '', url);
  
  // Stop only left panel auto-rotate
  if (leftAutoRotateInterval) {
    clearInterval(leftAutoRotateInterval);
    leftAutoRotateInterval = null;
  }
  
  loadImagesLeft(newDir.replace(/\\/g, '/'));
});

dirSelectRight.addEventListener('change', (e) => {
  const newDir = e.target.value;
  console.log('Right directory changed to:', newDir);
  rightDirectoryPath = newDir;
  const url = new URL(window.location);
  url.searchParams.set('dirRight', newDir);
  window.history.pushState({}, '', url);
  
  // Stop only right panel auto-rotate
  if (rightAutoRotateInterval) {
    clearInterval(rightAutoRotateInterval);
    rightAutoRotateInterval = null;
  }
  
  loadImagesRight(newDir.replace(/\\/g, '/'));
});

document.addEventListener('keydown', handleKeyDown);

// Initialize
loadAppConfig().then(() => {
  updateSpeedFromConfig();
  
  // Initialize shuffle from config
  const shuffleConfig = getConfig('shuffleOrder');
  if (shuffleConfig && shuffleConfig.enabled !== undefined) {
    isShuffleEnabled = shuffleConfig.enabled;
    if (shuffleCheckbox) {
      shuffleCheckbox.checked = isShuffleEnabled;
    }
  }
  
  loadDirectories();
});

// Handle URL changes (back/forward buttons)
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dirLeftParam = urlParams.get('dirLeft');
  const dirRightParam = urlParams.get('dirRight');

  if (dirLeftParam) {
    leftDirectoryPath = dirLeftParam;
    loadImagesLeft(dirLeftParam);
    dirSelectLeft.value = dirLeftParam;
  }
  if (dirRightParam) {
    rightDirectoryPath = dirRightParam;
    loadImagesRight(dirRightParam);
    dirSelectRight.value = dirRightParam;
  }
});

// ============================================
// SPLITTER DRAG FUNCTIONALITY
// ============================================

splitter.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  
  // Get the current flex-basis of the left panel (in %)
  const leftPanel = document.querySelector('.viewer-panel:first-child');
  const computedStyle = window.getComputedStyle(leftPanel);
  const widthStr = computedStyle.width;
  const bodyWidth = document.body.getBoundingClientRect().width;
  startWidthLeft = parseFloat(widthStr) / bodyWidth * 100;
  
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  e.preventDefault();
  
  const bodyWidth = document.body.getBoundingClientRect().width;
  const deltaX = e.clientX - startX;
  const deltaPercent = (deltaX / bodyWidth) * 100;
  
  let newLeftWidth = startWidthLeft + deltaPercent;
  
  // Clamp values
  newLeftWidth = Math.max(10, Math.min(90, newLeftWidth));
  
  const leftPanel = document.querySelector('.viewer-panel:first-child');
  const rightPanel = document.querySelector('.viewer-panel:last-child');
  
  // Use flex-basis for both panels to ensure equal max-height behavior
  leftPanel.style.flex = '1 1 0%';
  leftPanel.style.flexBasis = `${newLeftWidth}%`;
  rightPanel.style.flex = '1 1 0%';
  rightPanel.style.flexBasis = `${100 - newLeftWidth}%`;
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

document.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

// Auto-rotate controls (speed range only - checkboxes are now per-panel)
const speedRange = document.getElementById('speedRange');

if (speedRange) {
  speedRange.addEventListener('input', (e) => {
    autoRotateSpeed = parseFloat(e.target.value);
    updateTimerDisplay();
    if (leftAutoRotateEnabled) {
      startLeftAutoRotate();
    }
    if (rightAutoRotateEnabled) {
      startRightAutoRotate();
    }
  });
}
// Auto-rotate controls for left panel (using cached elements)

if (autoRotateCheckLeft) {
  autoRotateCheckLeft.addEventListener('change', (e) => {
    leftAutoRotateEnabled = e.target.checked;
    if (leftAutoRotateEnabled) {
      startLeftAutoRotate();
    } else {
      if (leftAutoRotateInterval) {
        clearInterval(leftAutoRotateInterval);
        leftAutoRotateInterval = null;
      }
    }
  });
}

if (speedRangeLeft) {
  speedRangeLeft.addEventListener('input', (e) => {
    leftAutoRotateSpeed = parseFloat(e.target.value);
    updateTimerDisplay();
    if (leftAutoRotateEnabled) {
      startLeftAutoRotate(); // Restart with new speed
    }
  });
}

// Auto-rotate controls for right panel (using cached elements)
let sharedRecursiveModeCheck = true
sharedRecursiveModeCheckbox.checked = false

// if (sharedRecursiveModeCheckbox) {
//   speedRangeRight.addEventListener('change', (e) => {
//     sharedRecursiveModeCheck = e.target.checked;
//     console.log("sharedRecursiveModeCheck is " + sharedRecursiveModeCheck)
//     window.location.href(window.location.href+"?isRecursiveDirectoryMode=true");

//   });
// }

// Shuffle checkbox handler
if (shuffleCheckbox) {
  shuffleCheckbox.addEventListener('change', (e) => {
    isShuffleEnabled = e.target.checked;
    console.log("Shuffle enabled:", isShuffleEnabled);
    // Reload current images with shuffle setting
    loadImagesLeft(leftDirectoryPath);
    loadImagesRight(rightDirectoryPath);
  });
}

if (autoRotateCheckRight) {
  autoRotateCheckRight.addEventListener('change', (e) => {
    rightAutoRotateEnabled = e.target.checked;
    if (rightAutoRotateEnabled) {
      startRightAutoRotate();
    } else {
      if (rightAutoRotateInterval) {
        clearInterval(rightAutoRotateInterval);
        rightAutoRotateInterval = null;
      }
    }
  });
}

if (speedRangeRight) {
  speedRangeRight.addEventListener('input', (e) => {
    rightAutoRotateSpeed = parseFloat(e.target.value);
    updateTimerDisplay();
    if (rightAutoRotateEnabled) {
      startRightAutoRotate(); // Restart with new speed
    }
  });
}

// ============================================
// MOVE TO BASKET FUNCTIONALITY
// ============================================

// Move image to basket for left panel
async function moveToLeftBasket() {
  const result = await handleMoveToBasket(PANEL.LEFT, leftImageList, leftCurrentIndex, leftImageList[leftCurrentIndex]);
  
  if (result.success) {
    if (result.empty) {
      loadDirectories();
    } else {
      leftCurrentIndex = result.newIndex;
      showImageLeft(leftCurrentIndex);
    }
  } else {
    alert(`Error: ${result.error || 'Failed to move to basket'}`);
  }
}

// Move image to basket for right panel
async function moveToRightBasket() {
  const result = await handleMoveToBasket(PANEL.RIGHT, rightImageList, rightCurrentIndex, rightImageList[rightCurrentIndex]);
  
  if (result.success) {
    if (result.empty) {
      loadDirectories();
    } else {
      rightCurrentIndex = result.newIndex;
      showImageRight(rightCurrentIndex);
    }
  } else {
    alert(`Error: ${result.error || 'Failed to move to basket'}`);
  }
}

// ============================================
// ADD TO FAVORITES FUNCTIONALITY
// ============================================
// Add image to favorites for left panel
async function addToFavoritesLeft() {
  await handleAddToFavorites(PANEL.LEFT, leftImageList[leftCurrentIndex]);
}

// Add image to favorites for right panel
async function addToFavoritesRight() {
  await handleAddToFavorites(PANEL.RIGHT, rightImageList[rightCurrentIndex]);
}

// Info Panel Functions
function toggleInfoPanel() {
  console.log("ASDADS");
  
  if (infoPanel) {
    infoPanel.classList.toggle('hidden');
  }
}


// Info Panel Functions
function toggleInfoModal() {
  console.log(infoBtnLeft);
  
  if (infoModal) {
    infoModal.classList.toggle('hidden');
  }
}

function hideInfoPanel() {
  if (infoPanel) {
    infoPanel.classList.add('hidden');
  }
}
