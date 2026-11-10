import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['freximos.com', 'www.freximos.com', 'dev-eventos.freximos.com'],
    proxy: {
      '/api': 'http://backend:3000',
      '/uploads': 'http://backend:3000',
    },
  },
});
