import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Kept for convenience: same-origin requests, no CORS preflight. The backend also allows
      // http://localhost:5173 via CORS, so the proxy is no longer required.
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:5177',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:5177',
        changeOrigin: true,
      },
    },
  },
})
