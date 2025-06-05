import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration for VS Code webview
  build: {
    outDir: 'out/webview',
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/main.tsx'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    // Ensure compatibility with VS Code webview
    target: 'es2020',
    sourcemap: true
  },
  
  // Dev server configuration
  server: {
    port: 3000,
    open: false
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/webview'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});