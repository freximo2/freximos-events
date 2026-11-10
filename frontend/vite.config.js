import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Hosts públicos permitidos (desde VITE_ALLOWED_HOSTS, separados por coma)
const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts,
    proxy: {
      '/api': 'http://backend:3000',
      '/uploads': 'http://backend:3000',
    },
  },
});
