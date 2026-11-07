import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ekusa/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@ekusa/validation': path.resolve(__dirname, '../../packages/validation/src'),
      '@ekusa/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: ['admin.dekutsochoiceawards.site', 'localhost'],
  },
});