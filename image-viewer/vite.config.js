import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

const API_PORT = 3000;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/images': {
          target: `http://127.0.0.1:${API_PORT}`,
          changeOrigin: false
        },
        '/api/directories': {
          target: `http://127.0.0.1:${API_PORT}`,
          changeOrigin: false
        }
      }
    },
    plugins: [
      {
        name: 'filesystem-api',
        apply: 'serve',
        configureServer(server) {
          const http = require('http');
          const apiServer = http.createServer((req, res) => {
            if (req.url.startsWith('/api/images')) {
              const urlParams = new URLSearchParams(req.url.split('?')[1]);
              const dir = urlParams.get('dir') || '.';
              const baseDir = dir === '.' ? 'public' : path.join('public', dir);

              const fullPath = path.resolve(__dirname, baseDir);

              try {
                const entries = fs.readdirSync(fullPath);
                const images = entries
                  .filter(entry => {
                    const filePath = path.join(fullPath, entry);
                    if (!fs.statSync(filePath).isFile()) return false;
                    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].some(ext => entry.toLowerCase().endsWith(ext));
                  })
                  .map(entry => {
                    // Build path relative to public/ for Vite to serve correctly
                    const filePathInPublic = path.relative(path.resolve(__dirname, 'public'), path.join(baseDir, entry));
                    return `/${filePathInPublic}`;
                  });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(images));
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
              }
            } else if (req.url.startsWith('/api/directories')) {
              try {
                const publicDir = path.resolve(__dirname, 'public');
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
            } else {
              res.writeHead(404);
              res.end('Not found');
            }
          });

          apiServer.listen(API_PORT, () => {
            console.log(`API server running on http://127.0.0.1:${API_PORT}`);
          });

          server.httpServer.on('close', () => {
            apiServer.close();
          });
        }
      }
    ]
  };
});
