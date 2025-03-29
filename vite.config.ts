/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-vendor': [
            '@radix-ui/react-tooltip',
            'framer-motion',
            'sonner'
          ],
          'payment-vendor': [
            '@stripe/stripe-js',
            '@stripe/react-stripe-js',
            'stripe'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      '@radix-ui/react-tooltip',
      'framer-motion',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      'stripe',
      'sonner'
    ]
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
