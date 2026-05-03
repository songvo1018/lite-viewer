# Image Storage Architecture

## Overview

**Lite View** stores images separately from the executable file. The EXE contains only the application code and Electron runtime, while images are stored in a separate `public/` folder that must be placed alongside the EXE.

## Key Concepts

### What's Inside the EXE (~250MB)
- Electron runtime and framework
- Application JavaScript code
- HTML/CSS interfaces
- All libraries and dependencies

### What's Outside the EXE
- `public/` folder with all images and videos
- User data (logs, settings)
- Any additional assets you add

## Folder Structure

### After Building

```
release/Lite View-win32-x64/
├── Lite View.exe        # Application executable
├── public/              # Images folder (separate from EXE)
│   ├── nature/
│   │   ├── image1.jpg
│   │   └── video1.mp4
│   └── vacations/
│       ├── photo1.jpg
│       └── photo2.jpg
├── locales/             # Language files
├── node_modules/        # Dependencies (not in final build)
└── ... (other Electron files)
```

## Why Separate Storage?

### Benefits
- **Faster Updates**: Replace images without rebuilding the entire EXE
- **Smaller Updates**: Send only image changes (KB instead of MB)
- **Flexible Organization**: Add/remove images without recompilation
- **Easier Development**: View changes immediately without rebuilding

### Trade-offs
- **Larger Distribution**: Must distribute EXE + images folder
- **Path Sensitivity**: EXE expects images folder in specific location

## Usage Scenarios

### Initial Setup
1. Run `npm run build:exe`
2. Copy **entire** `release/Lite View-win32-x64/` folder to target computer
3. The `public/` folder is already included with your images

### Development Mode
When running in development mode, images are loaded from the project's `public/` folder:

```bash
# Full Electron app (includes API + Vite servers)
npm run electron

# Standalone servers (Vite + API only)
npm run start

# Individual servers
npm run dev   # Vite server only
npm run api   # API server only
```

All modes read images from `image-viewer/public/` directory.

### Adding New Images Later
**Option A: Replace entire images folder**
```bash
# In project directory
xcopy /E /I /Y new-images\* "release\Lite View-win32-x64\public\"
```

**Option B: Add to existing images**
```bash
# Copy new images to existing public folder
xcopy /Y new-image.jpg "release\Lite View-win32-x64\public\nature\"
```

### Updating Only Images
If you have a built EXE and want to update images:

1. Locate the `public/` folder next to `Lite View.exe`
2. Replace image files in that folder
3. No EXE rebuild needed!

## Build Process Details

The `build:exe` script performs two actions:

```bash
# 1. Build Electron EXE (images NOT included)
electron-packager . "Lite View" --platform=win32 --arch=x64 ...

# 2. Copy public/ folder alongside EXE
xcopy /E /I /Y public "release\Lite View-win32-x64\public"
```

The `xcopy` command ensures the images folder is placed at the same level as the EXE file.

## Distribution Checklist

Before distributing to another computer:

- [ ] `Lite View.exe` is present
- [ ] `public/` folder exists next to EXE
- [ ] All subdirectories are copied
- [ ] Test that images appear when EXE is launched

## Troubleshooting

### "No images found" Error
**Cause**: `public/` folder is missing or empty

**Solution**:
1. Verify `public/` exists next to `Lite View.exe`
2. Check that images are inside `public/`, not inside ASAR
3. Ensure file extensions are supported (.jpg, .png, .gif, .webp, .bmp, .svg, .mp4)

### EXE Doesn't Find Images
**Cause**: Images folder is in wrong location

**Correct**:
```
release/Lite View-win32-x64/
├── Lite View.exe    ← EXE here
└── public/          ← Images folder here (same level)
```

**Incorrect**:
```
release/Lite View-win32-x64/
├── Lite View.exe    ← EXE here
    └── public/      ← WRONG: inside EXE folder structure
```

### Development vs Production
- **Development**: `npm run electron` or `npm run start` reads from `image-viewer/public/`
- **Production**: EXE reads from `release/Lite View-win32-x64/public/`

## Development Servers

When running in development mode, two servers work together:

### Vite Dev Server (Port 5173)
- Serves static files from `public/` directory
- Handles HTML routing with History API support
- Enables hot module replacement (HMR) for development
- Access via: `http://localhost:5173/?dir=dirname`

### API Server (Port 3000)
Provides REST endpoints for file system operations:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images?dir=name` | GET | List images in directory |
| `/api/directories` | GET | List all directories |
| `/api/rename-directory` | POST | Rename a directory |
| `/api/ips` | GET | Get local IP addresses |

**Example requests:**
```bash
# List directories
curl http://localhost:3000/api/directories

# List images in a directory
curl "http://localhost:3000/api/images?dir=test-images"
```

See [BUILD_EXE.md](./BUILD_EXE.md) for more details on development servers.

## Technical Details

### Path Resolution
The application uses relative paths to locate images:
```javascript
// Images are loaded from: ./public/ directory relative to EXE
const imagePath = path.join(__dirname, 'public', directoryName, fileName);
```

### ASAR Packaging
Images are intentionally NOT bundled into the ASAR archive:
- ASAR: Contains only application code (~250MB)
- External: Images stored as separate files/folders

### Updating Images Post-Build
You can modify images after building without affecting the EXE:

```bash
# Navigate to where EXE is located
cd "release/Lite View-win32-x64"

# Add new images
copy "..\new-images\*" "public\"
```

## Migration Guide

### From Bundled to Separate Storage
If you previously had images inside the project:

1. Move all images from `public/` (or wherever they were) to the `public/` folder
2. Run `npm run build:exe`
3. The build script will automatically copy them to the release folder

### From Old Build System
If migrating from a different build system:

1. Ensure all images are in `image-viewer/public/` before building
2. Run `npm run build:exe`
3. The new system will handle copying to the release folder

## FAQ

**Q: Can I change the images folder location?**
A: No, the EXE expects `public/` at the same level. You would need to modify the source code to change this path.

**Q: What happens if I delete the public/ folder?**
A: The EXE will launch but show "No images found" message. Re-add the folder with images to restore functionality.

**Q: Can I encrypt or password-protect images?**
A: Not with this architecture. Images are stored as regular files.

**Q: Does this work on macOS/Linux?**
A: The current build system targets Windows only. For other platforms, you'd need to adjust the build scripts.

## Main Window Behavior

The main window displays "Lite View is Online" instead of a browser view:

- **Purpose**: Shows application status and server health
- **Size**: 600×400 pixels
- **Content**: 
  - "Lite View" header with gradient styling
  - Server status indicators (API and Vite)
  - Green badges for running services
  - Yellow badges during startup

- **When images load**: Images are served by the Vite dev server (port 5173), not embedded in the EXE
- **Network access**: Use the IP shown in logs window with port 5173 for browser access to images
