import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// GitHub Pages base path
// If your repo is named "username.github.io", use "/"
// If your repo is named something else (e.g., "AI-HROnboarding"), use "/AI-HROnboarding/"
// You can also set this via VITE_BASE_PATH environment variable
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base: base,
  plugins: [react()],
  server: {
    port: 3001,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  }
});