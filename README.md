# Lite View

A dual-pane media viewer built with Electron, Vite, and Node.js, featuring side-by-side image and video viewing with independent controls, keyboard navigation, and local network access.

## Overview

Lite View is a desktop application for browsing and managing images and videos. It features:

- **Dual viewer panels** - Display different directories simultaneously with independent navigation
- **Auto-rotate** - Side-by-side slide shows with configurable speed
- **Directory management** - Rename folders directly from the app
- **Organize media** - Move to basket or add to favorites
- **Local network access** - View media from other devices on your network
- **Cross-platform** - Electron-based with Windows, macOS, and Linux support

## Architecture

The application consists of three components:

| Component | Description | Port |
|-----------|-------------|------|
| **Electron app** | Desktop wrapper with status window | - |
| **Vite dev server** | Serves images and web interface | 5173 |
| **API server** | File system access and directory operations | 3000 |

## Project Structure

```
lite-view/
├── image-viewer/           # Main application source
│   ├── public/            # Images and videos (not bundled in EXE)
│   ├── dist/              # Web build output
│   ├── release/           # Built Electron applications
│   ├── index.html         # Main viewer interface
│   ├── logs-window.html   # Log display window
│   ├── electron-main.js   # Electron main process
│   ├── api-server.js      # Node.js API server
│   ├── vite.config.js     # Vite build configuration
│   └── package.json       # Dependencies
└── README.md              # This file
```

## Building the Executable

To create a standalone Windows application:

```bash
cd image-viewer
npm run build:exe
```

The executable is created at `image-viewer/release/Lite View-win32-x64/Lite View.exe`.

**Important:** The `public/` folder must be copied separately alongside the EXE. See [IMAGE_STORAGE.md](./image-viewer/IMAGE_STORAGE.md) for details.

## Usage

### Development Mode

```bash
cd image-viewer
npm install
npm run electron
```

### Standalone Development Servers (Browser-based)

```bash
cd image-viewer
npm run start
```

This starts the Vite dev server (port 5173) and API server (port 3000) without Electron. Access at `http://localhost:5173`

### Browser Access

Local: `http://localhost:5173/?dir=directory_name`

Network: `http://192.168.x.x:5173/?dir=directory_name`

## Documentation

- [image-viewer/README.md](./image-viewer/README.md) - Full application documentation
- [image-viewer/BUILD_EXE.md](./image-viewer/BUILD_EXE.md) - Building Windows executable
- [image-viewer/IMAGE_STORAGE.md](./image-viewer/IMAGE_STORAGE.md) - Image storage architecture

## Tech Stack

- **Electron** - Desktop application framework
- **Vite** - Fast build tool and dev server
- **Node.js** - Backend API server
- **HTML/CSS/JavaScript** - Frontend interface

## Created With

This project was created using **Qwen3-Coder-Next**.

## License

MIT
