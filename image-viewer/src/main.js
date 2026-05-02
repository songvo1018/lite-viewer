// File extensions to filter (images + videos)
const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4'];

// Current image index
let currentIndex = 0;
let imageList = [];

// DOM elements
const mediaWrapper = document.getElementById('mediaWrapper');
const imageInfo = document.getElementById('imageInfo');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dirSelect = document.getElementById('dirSelect');

// Load directory list on startup
async function loadDirectories() {
  try {
    const response = await fetch('/api/directories');
    if (!response.ok) throw new Error('Failed to load directories');
    const directories = await response.json();

    if (directories.length > 0) {
      dirSelect.innerHTML = directories
        .map(dir => `<option value="${dir.path}">${dir.name}</option>`)
        .join('');
      
      // Set selected directory from URL param
      const urlParams = new URLSearchParams(window.location.search);
      const dirParam = urlParams.get('dir') || directories[0].path;
      dirSelect.value = dirParam;
      
      loadImages(dirParam);
    } else {
      dirSelect.innerHTML = '<option value=".">No directories found</option>';
      imageInfo.textContent = 'No directories with files found in public/';
    }
  } catch (error) {
    console.error('Error loading directories:', error);
    dirSelect.innerHTML = '<option value=".">Error loading directories</option>';
  }
}

// Load image list from server
async function loadImages(directory) {
  try {
    const response = await fetch(`/api/images?dir=${encodeURIComponent(directory)}`);
    if (!response.ok) throw new Error('Failed to load images');
    imageList = await response.json();

    if (imageList.length > 0) {
      currentIndex = 0;
      showImage(currentIndex);
    } else {
      imageInfo.textContent = 'No files found in this directory';
      mainImage.src = '';
    }
  } catch (error) {
    console.error('Error loading files:', error);
    imageInfo.textContent = `Error: ${error.message}`;
    mainImage.src = '';
  }
}

// Display current file
function showImage(index) {
  if (imageList.length === 0) return;

  // Wrap around
  if (index < 0) index = imageList.length - 1;
  if (index >= imageList.length) index = 0;

  currentIndex = index;
  const filePath = imageList[currentIndex];
  const fileName = filePath.split('/').pop();

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
      mainImage.style.display = 'none';
      break;
  }
}

// Event listeners
prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
dirSelect.addEventListener('change', (e) => {
  const newDir = e.target.value;
  const url = new URL(window.location);
  url.searchParams.set('dir', newDir);
  window.history.pushState({}, '', url);
  loadImages(newDir);
});
document.addEventListener('keydown', handleKeyDown);

// Initialize
loadDirectories();

// Handle URL changes (back/forward buttons)
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dirParam = urlParams.get('dir');
  if (dirParam) {
    loadImages(dirParam);
    dirSelect.value = dirParam;
  }
});

// Touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].clientX;
  handleSwipe();
};

const handleSwipe = () => {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) {
    showImage(currentIndex + 1);
  }
  if (touchEndX > touchStartX + swipeThreshold) {
    showImage(currentIndex - 1);
  }
};

// Add touch event listeners to media wrapper
mediaWrapper.addEventListener('touchstart', handleTouchStart);
mediaWrapper.addEventListener('touchend', handleTouchEnd);
