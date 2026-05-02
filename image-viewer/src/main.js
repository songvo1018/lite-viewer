// Image file extensions to filter
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

// Current image index
let currentIndex = 0;
let imageList = [];

// DOM elements
const mainImage = document.getElementById('mainImage');
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
      imageInfo.textContent = 'No image directories found in public/';
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
      imageInfo.textContent = 'No images found in this directory';
      mainImage.src = '';
    }
  } catch (error) {
    console.error('Error loading images:', error);
    imageInfo.textContent = `Error: ${error.message}`;
    mainImage.src = '';
  }
}

// Display current image
function showImage(index) {
  if (imageList.length === 0) return;
  
  // Wrap around
  if (index < 0) index = imageList.length - 1;
  if (index >= imageList.length) index = 0;
  
  currentIndex = index;
  const imagePath = imageList[currentIndex];
  
  // Set image source (append timestamp to prevent caching)
  mainImage.src = `${imagePath}?t=${Date.now()}`;
  
  // Update info
  imageInfo.textContent = `${currentIndex + 1} / ${imageList.length} - ${imagePath.split('/').pop()}`;
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
  loadImages(e.target.value);
});
document.addEventListener('keydown', handleKeyDown);

// Initialize
loadDirectories();
