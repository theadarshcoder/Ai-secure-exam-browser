import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@vladmandic/face-api'],
    force: true // Force esbuild to clear cache and restart
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://vision-o16g.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
