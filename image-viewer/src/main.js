// File extensions to filter (images + videos)
const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4'];

// Splitter state
let isDragging = false;
let startX = 0;
let startWidthLeft = 50;

// DOM elements for left viewer
const mediaWrapperLeft = document.getElementById('mediaWrapperLeft');
const imageInfoLeft = document.getElementById('imageInfoLeft');
const prevBtnLeft = document.getElementById('prevBtnLeft');
const nextBtnLeft = document.getElementById('nextBtnLeft');
const dirSelectLeft = document.getElementById('dirSelectLeft');

// DOM elements for right viewer
const mediaWrapperRight = document.getElementById('mediaWrapperRight');
const imageInfoRight = document.getElementById('imageInfoRight');
const prevBtnRight = document.getElementById('prevBtnRight');
const nextBtnRight = document.getElementById('nextBtnRight');
const dirSelectRight = document.getElementById('dirSelectRight');

// Splitter element
const splitter = document.getElementById('splitter');

// Info panel elements
const infoPanel = document.getElementById('infoPanel');
const infoBtnLeft = document.getElementById('infoBtnLeft');
const infoBtnRight = document.getElementById('infoBtnRight');
const closeInfoPanelBtn = document.getElementById('closeInfoPanel');

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
  const infoModal = document.getElementById('infoModal');
  const renameModal = document.getElementById('renameModal');
  
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

const infoModal = document.getElementById('infoModal');

// Close modal when clicking close button
const closeBtn = document.querySelector('.close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    const renameModal = document.getElementById('renameModal');
    infoModal.classList.toggle("hidden");
    renameModal.style.display = 'none';
  });
}

// Rename functionality for left panel
const renameBtnLeft = document.getElementById('renameBtnLeft');
const renameModal = document.getElementById('renameModal');
const currentDirNameEl = document.getElementById('currentDirName');
const newDirNameInput = document.getElementById('newDirName');
const confirmRenameBtn = document.getElementById('confirmRename');
const cancelRenameBtn = document.getElementById('cancelRename');

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
const renameBtnRight = document.getElementById('renameBtnRight');
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
    let response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}`);
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
    console.log(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}`)
    let response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}&isRecursiveDirectoryMode=${sharedRecursiveModeCheck}`);
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
    
    // Restart auto-rotate interval for images
    if (leftAutoRotateEnabled && !leftAutoRotateInterval) {
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
    
    // Restart auto-rotate interval for images
    if (rightAutoRotateEnabled && !rightAutoRotateInterval) {
      startRightAutoRotate();
    }
  }

  // Update info
  imageInfoRight.textContent = `Right: ${rightCurrentIndex + 1} / ${rightImageList.length} - ${fileName}`;
}

// Keyboard navigation
function handleKeyDown(event) {
  // Suppress navigation if rename modal is open
  const renameModal = document.getElementById('renameModal');
  if (renameModal && renameModal.style.display === 'block') {
    return;
  }

  // Q/Й: Pause/Resume left panel auto-rotate
  if (event.key === 'q' || event.key === 'Q' || event.key === 'й' || event.key === 'Й') {
    if (leftAutoRotateInterval) {
      clearInterval(leftAutoRotateInterval);
      leftAutoRotateInterval = null;
    } else if (leftAutoRotateEnabled) {
      startLeftAutoRotate();
    }
  }

  // E/Ц: Pause/Resume right panel auto-rotate
  if (event.key === 'e' || event.key === 'E' || event.key === 'ц' || event.key === 'Ц') {
    if (rightAutoRotateInterval) {
      clearInterval(rightAutoRotateInterval);
      rightAutoRotateInterval = null;
    } else if (rightAutoRotateEnabled) {
      startRightAutoRotate();
    }
  }

  // Space: Pause/Resume current panel's auto-rotate (left panel has priority)
  if (event.code === 'Space' && event.key === ' ') {
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
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A' || event.key === 'ф' || event.key === 'Ф') {
    if (leftImageList.length > 0) {
      showImageLeft(leftCurrentIndex - 1);
    }
  }

  // Right viewer navigation (D, Right Arrow, Ж, В)
  if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D' || event.key === 'ж' || event.key === 'В') {
    if (rightImageList.length > 0) {
      showImageRight(rightCurrentIndex + 1);
    }
  }

  // Escape to hide info panel or clear media viewer
  if (event.key === 'Escape') {
    if (infoPanel && !infoPanel.classList.contains('hidden')) {
      hideInfoPanel();
      return;
    }
    mediaWrapperLeft.innerHTML = '';
    mediaWrapperRight.innerHTML = '';
  }

  // Z/Я: Move left panel image to basket
  if (event.key === 'z' || event.key === 'Z' || event.key === 'я' || event.key === 'Я') {
    event.preventDefault();
    moveToLeftBasket();
    return;
  }

  // C/С: Move right panel image to basket
  if (event.key === 'c' || event.key === 'C' || event.key === 'с' || event.key === 'С') {
    event.preventDefault();
    moveToRightBasket();
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
loadDirectories();

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
// Auto-rotate controls for left panel
const autoRotateCheckLeft = document.getElementById('autoRotateCheckLeft');
const speedRangeLeft = document.getElementById('speedRangeLeft');

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

// Auto-rotate controls for right panel
const autoRotateCheckRight = document.getElementById('autoRotateCheckRight');
const speedRangeRight = document.getElementById('speedRangeRight');
const sharedRecursiveModeCheckbox = document.getElementById('sharedRecursiveModeCheck');
let sharedRecursiveModeCheck = true
sharedRecursiveModeCheckbox.checked = false

// if (sharedRecursiveModeCheckbox) {
//   speedRangeRight.addEventListener('change', (e) => {
//     sharedRecursiveModeCheck = e.target.checked;
//     console.log("sharedRecursiveModeCheck is " + sharedRecursiveModeCheck)
//     window.location.href(window.location.href+"?isRecursiveDirectoryMode=true");

//   });
// }


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
  if (leftImageList.length === 0 || leftCurrentIndex < 0) return;

  const currentFile = leftImageList[leftCurrentIndex];
  // Normalize path - replace backslashes with forward slashes
  const normalizedFile = currentFile.replace(/\\/g, '/');
  console.log('Move to basket (left):', currentFile, '->', normalizedFile);

  try {
    const response = await fetch('/api/move-to-basket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: normalizedFile })
    });
    
    console.log('Response status:', response.status);

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Moved to basket (left):', result.newPath);
      
      // Remove from current list
      leftImageList.splice(leftCurrentIndex, 1);
      
      // If list is empty, reload directories
      if (leftImageList.length === 0) {
        loadDirectories();
      } else {
        // Show next image (wrap around if needed)
        if (leftCurrentIndex >= leftImageList.length) {
          leftCurrentIndex = 0;
        }
        showImageLeft(leftCurrentIndex);
      }
    } else {
      alert(`Error: ${result.error || 'Failed to move to basket'}`);
    }
  } catch (error) {
    console.error('Move to basket (left) error:', error);
    alert('Error: ' + error.message);
  }
}

// Move image to basket for right panel
async function moveToRightBasket() {
  if (rightImageList.length === 0 || rightCurrentIndex < 0) return;

  const currentFile = rightImageList[rightCurrentIndex];
  // Normalize path - replace backslashes with forward slashes
  const normalizedFile = currentFile.replace(/\\/g, '/');
  console.log('Move to basket (right):', currentFile, '->', normalizedFile);

  try {
    const response = await fetch('/api/move-to-basket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: normalizedFile })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Moved to basket (right):', result.newPath);
      
      // Remove from current list
      rightImageList.splice(rightCurrentIndex, 1);
      
      // If list is empty, reload directories
      if (rightImageList.length === 0) {
        loadDirectories();
      } else {
        // Show next image (wrap around if needed)
        if (rightCurrentIndex >= rightImageList.length) {
          rightCurrentIndex = 0;
        }
        showImageRight(rightCurrentIndex);
      }
    } else {
      alert(`Error: ${result.error || 'Failed to move to basket'}`);
    }
  } catch (error) {
    console.error('Move to basket (right) error:', error);
    alert('Error: ' + error.message);
  }
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
