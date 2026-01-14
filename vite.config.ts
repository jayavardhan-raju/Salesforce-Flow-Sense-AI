import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Use resolve('index.tsx') to resolve relative to CWD, avoiding __dirname issues
        index: resolve('index.tsx'),
      },
      output: {
        entryFileNames: 'index.js',
        format: 'iife', // Immediately Invoked Function Expression for isolation
        name: 'FlowSenseExtension',
        // Bundle all dependencies into the single file
        inlineDynamicImports: true,
        extend: true
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    // CRITICAL: You must replace this with your actual API key before building
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "YOUR_GEMINI_API_KEY_HERE")
  }
});