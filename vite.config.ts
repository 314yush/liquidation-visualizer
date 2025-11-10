import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/avantisfi': {
        target: 'https://socket-api.avantisfi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/avantisfi/, ''),
        secure: true,
      },
      '/api/binance': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
        secure: true,
      },
    },
  },
})


