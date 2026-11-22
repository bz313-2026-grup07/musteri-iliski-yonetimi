import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api isteklerini backend'e yönlendirir; böylece arayüzde tam adres yazmaya gerek kalmaz
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
