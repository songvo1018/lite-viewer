// File extensions to filter (images + videos)
const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4'];

// Current image index
let currentIndex = 0;
let imageList = [];
let currentDirectoryPath = '';

// DOM elements
const mediaWrapper = document.getElementById('mediaWrapper');
const imageInfo = document.getElementById('imageInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtnMobile = document.getElementById('prevBtnMobile');
const nextBtnMobile = document.getElementById('nextBtnMobile');
const timerBtn = document.getElementById('timerBtn');
const timerValue = document.getElementById('timerValue');
const autoRotateCheck = document.getElementById('autoRotateCheck');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const dirSelect = document.getElementById('dirSelect');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const renameBtn = document.getElementById('renameBtn');
const renameModal = document.getElementById('renameModal');
const currentDirNameEl = document.getElementById('currentDirName');
const newDirNameInput = document.getElementById('newDirName');
const confirmRenameBtn = document.getElementById('confirmRename');
const cancelRenameBtn = document.getElementById('cancelRename');
const closeBtn = document.querySelector('.close');

// Auto-rotate state
let autoRotateEnabled = false;
let autoRotateInterval = null;
let autoRotateSpeed = 2; // Default 2 seconds

// Update timer display
function updateTimerDisplay() {
  if (timerValue) {
    timerValue.textContent = `${autoRotateSpeed}s`;
  }
}

// Auto-rotate images
function startAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
  }
  
  if (autoRotateEnabled && imageList.length > 0) {
    autoRotateInterval = setInterval(() => {
      showImage(currentIndex + 1);
    }, autoRotateSpeed * 1000);
  }
}

function stopAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
    autoRotateInterval = null;
  }
}

// Load IP addresses from API
async function loadIPs() {
  try {
    const response = await fetch('/api/ips');
    if (response.ok) {
      const ips = await response.json();
      ipList.innerHTML = ips.map(ip => `<div class="ip-item">${ip}:3000</div>`).join('');
    } else {
      ipList.innerHTML = '<div class="ip-item">Unable to fetch IPs</div>';
    }
  } catch (error) {
    // Fallback: try to get IPs from localStorage or use placeholder
    ipList.innerHTML = '<div class="ip-item">192.168.x.x:3000</div><div class="ip-item">Access API on port 3000</div>';
  }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === infoModal) {
    infoModal.style.display = 'none';
  }
  if (e.target === renameModal) {
    renameModal.style.display = 'none';
  }
});

// Event listeners for info button
if (infoBtn) {
  infoBtn.addEventListener('click', () => {
    infoModal.style.display = 'block';
    loadIPs();
  });
}

// Close modal when clicking close button
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
    renameModal.style.display = 'none';
  });
}

// Event listeners for rename button
// Log all fetch requests for debugging
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  console.log('[FETCH]', args[0], args[1]);
  const response = await originalFetch(...args);
  console.log('[FETCH RESPONSE]', args[0], response.status);
  return response;
};

if (renameBtn) {
  renameBtn.addEventListener('click', () => {
    console.log('Rename button clicked, currentDirectoryPath:', currentDirectoryPath);
    if (currentDirectoryPath) {
      renameModal.style.display = 'block';
      currentDirNameEl.textContent = currentDirectoryPath.split('/').pop() || currentDirectoryPath;
      newDirNameInput.value = '';
      newDirNameInput.focus();
    } else {
      console.warn('currentDirectoryPath is empty!');
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
      const normalizedOldPath = currentDirectoryPath.replace(/\\/g, '/');
      console.log('Rename attempt:', {
        currentDirectoryPath,
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

        // Update currentDirectoryPath to the new name
        currentDirectoryPath = newName.replace(/\\/g, '/');

        // Reload directories to show the renamed directory
        loadDirectories();
        // Update the select to show the renamed directory
        setTimeout(() => {
          dirSelect.value = currentDirectoryPath;
          loadImages(currentDirectoryPath);
          
          // Update URL to reflect the renamed directory
          const url = new URL(window.location);
          url.searchParams.set('dir', currentDirectoryPath);
          window.history.pushState({}, '', url);
        }, 300);
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Failed to rename directory';
        const debugInfo = error.requestedPath || error.fullSearchPath
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
    const response = await fetch('/api/directories');
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
      dirSelect.innerHTML = directories
        .map(dir => `<option value="${dir.path}">${dir.name}</option>`)
        .join('');

      // Set selected directory from URL param
      const urlParams = new URLSearchParams(window.location.search);
      const dirParam = urlParams.get('dir') || directories[0].path;
      dirSelect.value = dirParam;
      currentDirectoryPath = dirParam;

      loadImages(dirParam);
    } else {
      dirSelect.innerHTML = '<option value=".">No directories found</option>';
      currentDirectoryPath = '';
      imageInfo.textContent = 'No directories with files found in public/';
    }
  } catch (error) {
    console.error('Error loading directories:', error);
    dirSelect.innerHTML = '<option value=".">Error loading directories</option>';
  }
}

// Load image list from server
async function loadImages(directory) {
  // Normalize path: replace backslashes with forward slashes
  const normalizedDir = directory.replace(/\\/g, '/');
  console.log('loadImages called with directory:', directory, '->', normalizedDir);

  try {
    const response = await fetch(`/api/images?dir=${encodeURIComponent(normalizedDir)}`);
    const responseText = await response.clone().text();
    console.log('Images API response:', response.status, responseText.substring(0, 200));

    if (!response.ok) throw new Error('Failed to load images');
    imageList = await response.json();
    console.log('imageList loaded:', imageList.length, 'items');

    if (imageList.length > 0) {
      currentIndex = 0;
      showImage(currentIndex);
    } else {
      console.warn('No images found in directory');
      imageInfo.textContent = 'No files found in this directory';
      mediaWrapper.innerHTML = '';
    }
  } catch (error) {
    console.error('Error loading files:', error);
    imageInfo.textContent = `Error: ${error.message}`;
    mediaWrapper.innerHTML = '';
  }
}

// Display current file
function showImage(index) {
  console.log('showImage called with index:', index, 'imageList.length:', imageList.length);
  if (imageList.length === 0) {
    console.warn('imageList is empty');
    return;
  }

  // Wrap around
  if (index < 0) index = imageList.length - 1;
  if (index >= imageList.length) index = 0;

  currentIndex = index;
  const filePath = imageList[currentIndex];
  const fileName = filePath.split('/').pop();
  console.log('Displaying:', filePath, 'as', fileName);

  // Clear previous content
  mediaWrapper.innerHTML = '';

  // Check if it's a video file
  const isVideo = filePath.toLowerCase().endsWith('.mp4');

  if (isVideo) {
    // Display as video element
    mediaWrapper.innerHTML = `<video src="${filePath}?t=${Date.now()}" controls style="max-width: 100%; max-height: 100%;"></video>`;
  } else {
    // Display as image
    const img = document.createElement('img');
    img.src = `${filePath}?t=${Date.now()}`;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    mediaWrapper.appendChild(img);
  }

  // Update info
  imageInfo.textContent = `${currentIndex + 1} / ${imageList.length} - ${fileName}`;
}

// Keyboard navigation
function handleKeyDown(event) {
  // Suppress navigation if rename modal is open
  if (renameModal.style.display === 'block') {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      showImage(currentIndex - 1);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      showImage(currentIndex + 1);
      break;
    case 'Escape':
      mediaWrapper.innerHTML = '';
      break;
    case 'r':
    case 'R':
      if (renameBtn && currentDirectoryPath) {
        renameBtn.click();
      }
      break;
  }
}

// Event listeners
if (prevBtn) {
  prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
}
if (prevBtnMobile) {
  prevBtnMobile.addEventListener('click', () => showImage(currentIndex - 1));
}
if (nextBtnMobile) {
  nextBtnMobile.addEventListener('click', () => showImage(currentIndex + 1));
}
if (timerBtn) {
  timerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('timerDropdown');
    dropdown.classList.toggle('show');
  });
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  if (e.target !== timerBtn && !timerBtn.contains(e.target)) {
    const dropdown = document.getElementById('timerDropdown');
    dropdown.classList.remove('show');
  }
  if (e.target === infoModal) {
    infoModal.style.display = 'none';
  }
});

// Auto-rotate controls
if (autoRotateCheck) {
  autoRotateCheck.addEventListener('change', (e) => {
    autoRotateEnabled = e.target.checked;
    if (autoRotateEnabled) {
      startAutoRotate();
    } else {
      stopAutoRotate();
    }
  });
}

if (speedRange) {
  speedRange.addEventListener('input', (e) => {
    autoRotateSpeed = parseFloat(e.target.value);
    updateTimerDisplay();
    if (autoRotateEnabled) {
      startAutoRotate(); // Restart with new speed
    }
  });
}

if (speedValue) {
  speedValue.textContent = `${autoRotateSpeed} сек`;
}

dirSelect.addEventListener('change', (e) => {
  const newDir = e.target.value;
  console.log('Directory changed to:', newDir);
  currentDirectoryPath = newDir;
  const url = new URL(window.location);
  url.searchParams.set('dir', newDir);
  window.history.pushState({}, '', url);
  stopAutoRotate(); // Stop auto-rotate when changing directories
  // Normalize path when loading images
  loadImages(newDir.replace(/\\/g, '/'));
});
document.addEventListener('keydown', handleKeyDown);

// Initialize
loadDirectories();

// Handle URL changes (back/forward buttons)
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dirParam = urlParams.get('dir');
  if (dirParam) {
    currentDirectoryPath = dirParam;
    loadImages(dirParam);
    dirSelect.value = dirParam;
  }
});
