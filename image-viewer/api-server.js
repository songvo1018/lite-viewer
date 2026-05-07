const http = require('http');
const path = require('path');
const fs = require('fs');

const API_PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Get local IP addresses
function getLocalIPs() {
  const interfaces = require('os').networkInterfaces();
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

// Log message
function logMessage(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, message, type };
  console.log(`[${type.toUpperCase()}] ${message}`);
  return logEntry;
}

// Create API server
function createApiServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url.startsWith('/api/images')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const dir = urlParams.get('dir') || '.';
        const isRecursiveDirectoryMode = urlParams.get('isRecursiveDirectoryMode') === 'true';

        const fullPath = dir === '.' ? PUBLIC_DIR : path.join(PUBLIC_DIR, dir);

        try {
          if (!fs.existsSync(fullPath)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Directory not found' }));
            return;
          }

          const entries = fs.readdirSync(fullPath, { recursive: isRecursiveDirectoryMode });

          const files = entries
            .filter(entry => {
              const filePath = path.join(fullPath, entry);
              if (!fs.statSync(filePath).isFile()) return false;
              return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.mp4'].some(ext => entry.toLowerCase().endsWith(ext));
            })
            .map(entry => {
              const relativePath = path.relative(PUBLIC_DIR, path.join(fullPath, entry));
              // Normalize path to forward slashes for web compatibility
              const normalizedPath = relativePath.replace(/\\/g, '/');
              return `/${normalizedPath}`;
            });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(files));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url.startsWith('/api/directories')) {
        try {
          logMessage(`Directories request - publicDir: ${PUBLIC_DIR}, exists: ${fs.existsSync(PUBLIC_DIR)}`, 'info');

          if (!fs.existsSync(PUBLIC_DIR)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Public directory not found' }));
            return;
          }

          const entries = fs.readdirSync(PUBLIC_DIR);
          logMessage(`Directories found: ${entries.length}`, 'info');

          const directories = entries
            .filter(entry => {
              const fullPath = path.join(PUBLIC_DIR, entry);
              const isDir = fs.statSync(fullPath).isDirectory();
              if (isDir) logMessage(`  Directory: ${entry}`, 'info');
              return isDir;
            })
            .map(entry => ({ name: entry, path: entry }));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(directories));
        } catch (error) {
          logMessage(`Failed to list directories: ${error.message}`, 'error');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      } else if (req.url.startsWith('/api/rename-directory') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { oldPath, newPath } = JSON.parse(body);
            // Normalize paths
            const normalizedOldPath = oldPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
            const normalizedNewPath = newPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

            const oldFullPath = path.join(PUBLIC_DIR, normalizedOldPath);
            const newFullPath = path.join(PUBLIC_DIR, normalizedNewPath);

            logMessage(`Rename: "${normalizedOldPath}" -> "${normalizedNewPath}"`, 'info');

            if (!fs.existsSync(oldFullPath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Directory not found',
                requestedPath: normalizedOldPath,
                publicDir: PUBLIC_DIR
              }));
              return;
            }

            if (fs.existsSync(newFullPath)) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Directory with new name already exists' }));
              return;
            }

            fs.renameSync(oldFullPath, newFullPath);
            logMessage(`Renamed: ${normalizedOldPath} -> ${normalizedNewPath}`, 'success');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, newPath: normalizedNewPath }));
          } catch (error) {
            logMessage(`Failed to rename directory: ${error.message}`, 'error');
            
            // Check for specific error types
            const errorMessage = error.message || 'Failed to rename directory';
            let userMessage = errorMessage;
            
            if (errorMessage.includes('EPERM') || errorMessage.includes('operation not permitted')) {
              userMessage = `Operation not permitted. 
- Source path: ${oldFullPath}
- Target path: ${newFullPath}
- Make sure the directory is not in use, you have permission to rename it, and the target directory does not exist.`;
            } else if (errorMessage.includes('ENOENT')) {
              userMessage = 'Directory not found.';
            } else if (errorMessage.includes('EEXIST')) {
              userMessage = 'A directory with this name already exists.';
            }
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: userMessage, details: errorMessage, oldPath: oldFullPath, newPath: newFullPath }));
          }
        });
        return;
      } else if (req.url.startsWith('/api/move-to-basket') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { filePath } = JSON.parse(body);

            // Normalize path - convert backslashes to forward slashes and remove leading/trailing slashes
            const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
            
            // Build path
            const sourceFullPath = path.join(PUBLIC_DIR, normalizedPath);
            
            logMessage(`Move to basket request: ${normalizedPath}`, 'info');
            logMessage(`Source path: ${sourceFullPath}`, 'info');
            logMessage(`Source path exists: ${fs.existsSync(sourceFullPath)}`, 'info');

            if (!fs.existsSync(sourceFullPath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'File not found' }));
              return;
            }

            // Create basket directory if it doesn't exist
            const basketDir = path.join(PUBLIC_DIR, 'basket');
            if (!fs.existsSync(basketDir)) {
              fs.mkdirSync(basketDir, { recursive: true });
              logMessage(`Created basket directory: ${basketDir}`, 'info');
            }

            const fileName = path.basename(normalizedPath);
            const destFullPath = path.join(basketDir, fileName);

            // Check if file already exists in basket
            let destPath = destFullPath;
            let counter = 1;
            while (fs.existsSync(destPath)) {
              const nameWithoutExt = path.basename(normalizedPath, path.extname(normalizedPath));
              const ext = path.extname(normalizedPath);
              destPath = path.join(basketDir, `${nameWithoutExt}_${counter}${ext}`);
              counter++;
            }

            // Move the file
            fs.renameSync(sourceFullPath, destPath);

            logMessage(`Moved to basket: ${normalizedPath} -> ${path.relative(PUBLIC_DIR, destPath)}`, 'success');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              oldPath: normalizedPath,
              newPath: path.relative(PUBLIC_DIR, destPath)
            }));
          } catch (error) {
            logMessage(`Failed to move to basket: ${error.message}`, 'error');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
        return;
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
      resolve(server);
    });

    server.on('error', (error) => {
      logMessage(`API server error: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Start server
createApiServer()
  .then(server => {
    logMessage('API server started successfully', 'success');
    logMessage(`Public directory: ${PUBLIC_DIR}`, 'info');
    
    // List directories on startup
    try {
      const entries = fs.readdirSync(PUBLIC_DIR);
      const dirs = entries.filter(e => fs.statSync(path.join(PUBLIC_DIR, e)).isDirectory());
      logMessage(`Found ${dirs.length} directories: ${dirs.join(', ')}`, 'info');
    } catch (e) {
      logMessage(`Could not list directories: ${e.message}`, 'error');
    }
  })
  .catch(error => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  process.exit(0);
});
