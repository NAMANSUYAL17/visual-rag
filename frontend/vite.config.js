import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/ingest':  'http://localhost:8000',
      '/query':   'http://localhost:8000',
      '/pdf':     'http://localhost:8000',
      '/pdfs':    'http://localhost:8000',
      '/status':  'http://localhost:8000',
      '/images':  'http://localhost:8000',
    }
  }
})