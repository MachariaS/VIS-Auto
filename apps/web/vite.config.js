import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'http://localhost:4000';
const API_ROUTES = [
  '/health',
  '/auth',
  '/users',
  '/vehicles',
  '/provider-services',
  '/roadside-requests',
  '/vendors',
  '/locations',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: Object.fromEntries(
      API_ROUTES.map((route) => [route, { target: API_TARGET, changeOrigin: true }]),
    ),
  },
});
