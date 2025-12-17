import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: './',
  base: './',
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Content-Type': 'text/css; charset=utf-8'
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@modules': '/src/modules',
      '@utils': '/src/utils',
      '@store': '/src/store'
    }
  }
});
