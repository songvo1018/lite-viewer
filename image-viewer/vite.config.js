import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
      open: true,
      host: '0.0.0.0',
      proxy: {
        '/api/images': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        },
        '/api/directories': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        },
        '/api/ips': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        },
        '/api/rename-directory': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true
        },
        '/api/move-to-basket': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('[VITE PROXY] Proxying to:', 'http://127.0.0.1:3000' + req.url);
            });
          }
        },
        '/api/add-to-favorites': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('[VITE PROXY] Proxying to:', 'http://127.0.0.1:3000' + req.url);
            });
          }
        }
      }
    },
    plugins: []
  };
});
