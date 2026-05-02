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
        }
      }
    },
    plugins: []
  };
});
