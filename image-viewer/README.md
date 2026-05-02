# Image Viewer

Full-screen image and video viewer built with Vite. Supports images (JPG, PNG, GIF, WebP, BMP, SVG) and videos (MP4).

## Features

- 🔍 Full-screen image viewer with keyboard navigation
- ▶️ Video playback support (MP4 format)
- 📁 Directory-based browsing with dropdown selector
- 🎨 Modern dark theme UI
- 🔄 Automatic image reloading (prevents caching)
- 📱 Responsive design

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

The server will start on `http://localhost:5173/` and open automatically in your browser.

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

### Keyboard Controls

| Key | Action |
|-----|--------|
| `ArrowLeft` or `A` | Previous image/video |
| `ArrowRight` or `D` | Next image/video |
| `Esc` | Hide the media viewer (shows only navigation buttons) |

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
  // ...
}
```

### Adding More File Types

Modify the file extensions filter in `vite.config.js`:

```javascript
return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4', '.mov'].some(ext => entry.toLowerCase().endsWith(ext));
```

And in `src/main.js`:

```javascript
const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4', '.mov'];
```

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

### Videos not playing

- Ensure the video is in MP4 format
- Check browser compatibility (modern browsers support MP4 with H.264 codec)
- Try re-encoding the video with: `ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4`

## Development

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## License

MIT
