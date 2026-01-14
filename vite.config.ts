import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Removed rollupOptions that forced IIFE/JS-only output to allow standard Web App build with index.html
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    // CRITICAL: You must replace this with your actual API key before building
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "YOUR_GEMINI_API_KEY_HERE")
  }
});