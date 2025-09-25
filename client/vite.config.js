import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @import "tailwindcss"; to use Tailwind CSS with Vite

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',  // Proxy API requests to the backend server, replace with backend server port if different
    },
  },
});
