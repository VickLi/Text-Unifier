import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Electron file:// 协议不支持 crossorigin 属性，移除所有 crossorigin
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin(?=[\s>])/g, '');
      },
    },
  ],
  base: './',
  publicDir: '05-deployment/public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
