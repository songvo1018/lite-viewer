# Image Viewer

Full-screen image and video viewer built with Vite. Supports images (JPG, PNG, GIF, WebP, BMP, SVG) and videos (MP4).

## Features

- 🔍 Full-screen image viewer with keyboard navigation
- ▶️ Video playback support (MP4 format)
- 📁 Directory-based browsing with dropdown selector
- 🎨 Modern dark theme UI
- 🔄 Automatic media reloading (prevents caching)
- 📱 Fully responsive - works on mobile and desktop
- 📡 Local network access with automatic IP display

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm or yarn package manager

## Installation

1. Navigate to the project directory:
```bash
cd image-viewer
```

2. Install dependencies:
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

## Usage

### Starting the Dev Server

```bash
npm run dev
```

The server will start automatically in your browser. In the console, you'll see network addresses for accessing from other devices:

```
══════════════════════════════════════════════════
🌐 Access from other devices on local network:

   📱 Images: http://192.168.0.139:5173/
   📂 Directories: http://192.168.0.139:5173/api/directories
══════════════════════════════════════════════════

  VITE v8.0.10  ready in 201 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.0.139:5173/
```

### Adding Images and Videos

1. Place your image and video files in the `public/` directory (create it if it doesn't exist)

2. Create subdirectories for organizing your media:
```
image-viewer/
├── public/
│   ├── nature/           # Directory for nature images
│   │   ├── image1.jpg
│   │   ├── image2.png
│   │   └── video1.mp4
│   ├── vacations/        # Directory for vacation photos
│   │   ├── photo1.jpeg
│   │   └── photo2.webp
│   └── screenshots/      # Directory for screenshots
│       └── screen1.bmp
```

Supported formats:
- **Images**: JPG, JPEG, PNG, GIF, WebP, BMP, SVG
- **Videos**: MP4

### Viewing Media

#### From Browser

Access images from a specific directory using the URL parameter `dir`:

```
http://localhost:5173/?dir=nature
```

Or for nested directories:
```
http://localhost:5173/?dir=vacations/2024
```

If no `dir` parameter is provided, the first directory in `public/` will be used.

#### Using the Dropdown Selector

The viewer includes a dropdown menu at the top for easy directory selection. Selecting a directory will:
- Update the URL with the `dir` parameter
- Load all images/videos from that directory
- Enable browser navigation (back/forward buttons)

#### From Other Devices on Local Network

Copy the network address from the console output or use your computer's IP:

```
http://192.168.0.139:5173/?dir=nature
```

**Requirements:**
- Your computer and device must be on the same Wi-Fi/LAN
- Windows Firewall may prompt - allow access for local network
- Port 5173 must be accessible

### Controls

#### Keyboard (Desktop)

| Key | Action |
|-----|--------|
| `ArrowLeft` or `A` | Previous image/video |
| `ArrowRight` or `D` | Next image/video |
| `Esc` | Hide the media viewer (shows only navigation buttons) |

#### Touch (Mobile)

| Gesture | Action |
|---------|--------|
| Swipe right | Previous image/video |
| Swipe left | Next image/video |
| Tap video | Play/Pause |
| Tap image | Hide/show |

#### Navigation Buttons

- **Left/Right arrows** - Navigate through images
- Located at the bottom, near the directory selector

### Video Controls

Videos are displayed with native HTML5 player controls:
- Play/Pause
- Volume control
- Progress bar
- Fullscreen button

Videos autoplay with audio muted by default for a better viewing experience.

## Project Structure

```
image-viewer/
├── public/           # Static assets (images, videos)
│   └── [directories]/
├── src/
│   ├── main.js       # Application logic
│   └── style.css     # Styles
├── index.html        # Entry point
├── vite.config.js    # Vite configuration
└── package.json      # Dependencies
```

## Configuration

### Changing the Port

Edit `vite.config.js`:

```javascript
server: {
  port: 8080,  // Change to your desired port
  open: true,
  host: '0.0.0.0',  // Required for network access
  // ...
}
```

### Adding More File Types

Modify the file extensions filter in `vite.config.js` (around line 42):

```javascript
return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4', '.mov'].some(ext => entry.toLowerCase().endsWith(ext));
```

And in `src/main.js` (line 2):

```javascript
const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4', '.mov'];
```

### Customizing Styles

Edit `src/style.css` to change colors, sizes, and layout. Key selectors:
- `#app` - Main container
- `#mediaWrapper` - Image/video container
- `#imageInfo` - Filename display
- `.nav-btn` - Navigation buttons

## API Endpoints

### GET `/api/images?dir=directory_name`

Returns JSON array of image/video paths in the specified directory.

Example response:
```json
[
  "/nature/image1.jpg",
  "/nature/image2.png",
  "/nature/video1.mp4"
]
```

### GET `/api/directories`

Returns JSON array of available directories in `public/`.

Example response:
```json
[
  {"name": "nature", "path": "nature"},
  {"name": "vacations", "path": "vacations"}
]
```

## Troubleshooting

### "No files found in this directory"

- Ensure your files are in the `public/` directory
- Check that file extensions are supported
- Verify directory name matches (case-sensitive on some systems)

### "Failed to load images" error

- Make sure the dev server is running: `npm run dev`
- Check that the `public/` directory exists
- Verify files have correct extensions

### Cannot access from other devices

1. Check firewall allows port 5173
2. Verify devices are on same network
3. Check `vite.config.js` has `host: '0.0.0.0'`
4. Try using IP instead of hostname

### Videos not playing

- Ensure the video is in MP4 format with H.264 codec
- Check browser compatibility (modern browsers support MP4)
- Try re-encoding the video with: `ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4`

### Buttons not visible on mobile

On very small screens (< 480px), navigation buttons are hidden. Use swipe gestures to navigate instead.

## Development

### Building for Production

```bash
npm run build
```

This creates an optimized build in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally.

### Custom Build Configuration

Edit `vite.config.js` to customize:

```javascript
export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 5173,
      open: false,        // Don't open browser automatically
      host: '0.0.0.0',    // Allow network access
      // ...
    }
  };
});
```

## License

MIT
