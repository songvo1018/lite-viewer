const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let logsWindow = null;
let viteProcess = null;
let vitePort = 5173;
const API_PORT = 3000;
let apiServer = null;
let logsBuffer = [];

// Get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        ips.push(alias.address);
      }
    }
  }

  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// Create logs window
function createLogsWindow() {
  logsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1e1e1e',
    show: false,
    autoHideMenuBar: true
  });

  logsWindow.loadFile(path.join(__dirname, 'logs-window.html')).then(() => {
    logsWindow.show();
    logMessage('Logs window opened', 'info');
  });

  // Open DevTools for debugging
  logsWindow.webContents.openDevTools();

  logsWindow.on('close', (e) => {
    // Prevent closing if main window is still open
    if (mainWindow) {
      e.preventDefault();
      logMessage('Cannot close logs window while main window is open', 'warning');
    }
  });

  logsWindow.on('closed', () => {
    logMessage('Logs window closed', 'info');
    logsWindow = null;
    // Quit app if logs window is closed (main window is gone)
    if (!mainWindow) {
      app.quit();
    }
  });

  return logsWindow;
}

// Log message to both console and logs window
function logMessage(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, message, type };
  
  console.log(`[${type.toUpperCase()}] ${message}`);
  logsBuffer.push(logEntry);
  
  // Write to log file
  try {
    const logDir = app.getPath('userData');
    const logFile = path.join(logDir, 'app.log');
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(logFile, logLine);
  } catch (e) {
    // Ignore file write errors
  }

  try {
    if (logsWindow && !logsWindow.isDestroyed() && logsWindow.webContents) {
      logsWindow.webContents.send('log-message', logEntry);
    }
  } catch (error) {
    // Ignore errors if logs window is destroyed
  }
}

// Check if running in production (ASAR archive)
const isProduction = app.isPackaged;

// Start Vite dev server
function startViteServer() {
  return new Promise((resolve, reject) => {
    // For production (packed), we need to run from the app directory
    // In production, node_modules is at: path.dirname(app.getPath('exe'))/resources/app/node_modules
    // But we need to run from a directory where npm can find package.json
    // The package.json is at: path.dirname(app.getPath('exe'))/resources/app/package.json
    const exeDir = path.dirname(app.getPath('exe'));
    const appDir = path.join(exeDir, 'resources', 'app');
    
    const cwd = isProduction ? appDir : __dirname;

    viteProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      cwd: cwd,
      shell: true
    });

    let vitePort = 5173;
    let viteStarted = false;
    
    logMessage(`Starting Vite server from ${cwd}, expecting port ${vitePort}`, 'info');
    
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[VITE STDOUT]', output);
      
      // Remove ANSI color codes
      const cleanOutput = output.replace(/\u001b\[[0-9;]*m/g, '');

      // Match various Vite startup patterns - simplified regex
      const match = cleanOutput.match(/Local:\s*http:\/\/localhost:(\d+)\//);
      
      if (match) {
        vitePort = parseInt(match[1], 10);
        viteStarted = true;
        logMessage(`Vite server started on port ${vitePort}`, 'success');
        resolve(vitePort);
        return;
      }
      
      // Debug: log any line containing "Local" to see exact format
      if (output.includes('Local')) {
        logMessage(`[DEBUG] Found "Local" in: "${cleanOutput.trim()}"`, 'info');
      }

      // Log other Vite output (without colors for cleaner logs)
      if (cleanOutput.includes('Local:') || cleanOutput.includes('Network:') || cleanOutput.includes('Running at:') || cleanOutput.includes('vite')) {
        logMessage(cleanOutput.trim(), 'info');
      }
    });

    viteProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.trim()) {
        logMessage(`Vite stderr: ${output.trim()}`, 'error');
      }
    });

    viteProcess.on('error', (error) => {
      logMessage(`Vite process error: ${error.message}`, 'error');
      reject(error);
    });

    viteProcess.on('close', (code) => {
      logMessage(`Vite process exited with code ${code}`, 'warning');
      if (!viteStarted) {
        reject(new Error(`Vite process exited with code ${code}`));
      }
    });

    // Timeout for Vite startup
    setTimeout(() => {
      if (!viteStarted) {
        const error = new Error('Vite server failed to start (timeout)');
        logMessage(error.message, 'error');
        logMessage('Make sure "npm run dev" works manually in the project directory', 'warning');
        reject(error);
      }
    }, 30000);
  });
}

function createWindow() {
  logMessage(`Creating window, vitePort: ${vitePort}`, 'info');

  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false
      },
      backgroundColor: '#000',
      show: false,
      autoHideMenuBar: true
    });
    
    logMessage('Main window created successfully', 'success');
  } catch (error) {
    logMessage(`Failed to create main window: ${error.message}`, 'error');
    throw error;
  }

  const url = `http://localhost:${vitePort}`;
  logMessage(`Loading URL: ${url}`, 'info');

  // Always load from Vite dev server
  mainWindow.loadURL(url).catch(err => {
    logMessage(`Failed to load URL: ${err.message}`, 'error');
    console.error('Failed to load URL:', err);
  });

  // Open DevTools
  mainWindow.webContents.openDevTools();

  // Send status to logs window
  if (logsWindow && !logsWindow.isDestroyed()) {
    try {
      logsWindow.webContents.send('log-message', {
        timestamp: new Date().toLocaleTimeString(),
        message: 'Main window created',
        type: 'success'
      });
    } catch (e) {
      // Ignore
    }
  }

  mainWindow.on('closed', () => {
    logMessage('Main window closed, shutting down servers...', 'info');
    mainWindow = null;
    
    // Close logs window if it exists
    if (logsWindow && !logsWindow.isDestroyed()) {
      logsWindow.close();
    }
    
    // Close servers explicitly
    if (apiServer) {
      logMessage('Closing API server...', 'info');
      apiServer.close();
      apiServer = null;
    }
    
    if (viteProcess) {
      logMessage('Stopping Vite process...', 'info');
      viteProcess.kill();
      viteProcess = null;
    }
    
    // Quit app when main window closes
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });
  
  // Fallback: show after delay if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Showing window via fallback');
      mainWindow.show();
    }
  }, 3000);
}

// Get public directory path (works in both dev and production)
function getPublicDir() {
  if (isProduction) {
    // In production, public is next to the executable
    // app.getPath('exe') returns the full path to Lite View.exe
    // We need to get its parent directory, then look for 'public'
    const exeDir = path.dirname(app.getPath('exe'));
    const publicDir = path.join(exeDir, 'public');
    console.log('getPublicDir:', publicDir);
    return publicDir;
  } else {
    // In dev, public is in project root
    return path.join(__dirname, 'public');
  }
}

// Create API server for file system access
function createApiServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url.startsWith('/api/images')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const dir = urlParams.get('dir') || '.';

        const publicDir = getPublicDir();
        const fullPath = dir === '.' ? publicDir : path.join(publicDir, dir);

        try {
          if (!fs.existsSync(fullPath)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Directory not found' }));
            return;
          }

          const entries = fs.readdirSync(fullPath);
          const files = entries
            .filter(entry => {
              const filePath = path.join(fullPath, entry);
              if (!fs.statSync(filePath).isFile()) return false;
              return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4'].some(ext => entry.toLowerCase().endsWith(ext));
            })
            .map(entry => {
              const relativePath = path.relative(publicDir, path.join(fullPath, entry));
              return `/${relativePath}`;
            });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(files));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url.startsWith('/api/directories')) {
        try {
          const publicDir = getPublicDir();
          if (!fs.existsSync(publicDir)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Public directory not found' }));
            return;
          }

          const entries = fs.readdirSync(publicDir);
          const directories = entries
            .filter(entry => {
              const fullPath = path.join(publicDir, entry);
              return fs.statSync(fullPath).isDirectory();
            })
            .map(entry => ({ name: entry, path: entry }));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(directories));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url.startsWith('/api/ips')) {
        try {
          const ips = getLocalIPs();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(ips));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(API_PORT, () => {
      logMessage(`API server running on http://127.0.0.1:${API_PORT}`, 'success');
      
      // Update status in logs window
      try {
        if (logsWindow && !logsWindow.isDestroyed()) {
          logsWindow.webContents.send('status-update', { apiReady: true });
        }
      } catch (e) {}
      
      resolve(server);
    });

    server.on('error', (error) => {
      logMessage(`API server error: ${error.message}`, 'error');
      reject(error);
    });
  });
}

app.whenReady().then(async () => {
  // Create logs window first
  logsWindow = createLogsWindow();
  logMessage('Application starting...', 'info');

  // Give logs window time to initialize
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Create API server first
    apiServer = await createApiServer();
    logMessage('API server started successfully', 'success');
    
    // Update status
    try {
      if (logsWindow && !logsWindow.isDestroyed()) {
        logsWindow.webContents.send('status-update', { apiReady: true });
      }
    } catch (e) {}

    // Start Vite dev server
    vitePort = await startViteServer();
    logMessage(`Vite server started successfully on port ${vitePort}`, 'success');
    
    // Update status
    try {
      if (logsWindow && !logsWindow.isDestroyed()) {
        logsWindow.webContents.send('status-update', { viteReady: true });
      }
    } catch (e) {}
  } catch (error) {
    logMessage(`Failed to start servers: ${error.message}`, 'error');
    console.error('Failed to start servers:', error);
    app.quit();
    return;
  }

  createWindow();
  logMessage('Main window created', 'success');

  // Show IP addresses
  const ips = getLocalIPs();
  logMessage(`Local IP addresses: ${ips.join(', ')}`, 'info');
});

app.on('window-all-closed', () => {
  logMessage('window-all-closed event fired', 'info');
  logMessage(`Logs window exists: ${logsWindow !== null}`, 'info');
  logMessage(`Main window exists: ${mainWindow !== null}`, 'info');
  
  // Only quit if both windows are closed (on Windows)
  if (process.platform !== 'darwin') {
    if (!logsWindow && !mainWindow) {
      logMessage('All windows closed, quitting...', 'info');
      if (apiServer) {
        apiServer.close();
      }
      if (viteProcess) {
        viteProcess.kill();
      }
      app.quit();
    }
  }
});

app.on('will-quit', () => {
  logMessage('Application quitting...', 'info');
  if (apiServer) {
    logMessage('Closing API server...', 'info');
    apiServer.close();
    apiServer = null;
  }
  if (viteProcess) {
    logMessage('Stopping Vite process...', 'info');
    viteProcess.kill();
    viteProcess = null;
  }
  logsBuffer = [];
});
