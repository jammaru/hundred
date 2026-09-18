import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { spritePlugin } from './sprite-plugin.ts';

export default defineConfig({
  plugins: [react(), spritePlugin()],
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/ws': {
        target: 'ws://127.0.0.1:8787',
        ws: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
});
