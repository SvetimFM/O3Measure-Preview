import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    mkcert(),
    react()
  ],
  server: {
    https: true,
    host: '0.0.0.0',
    allowedHosts: 'all'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
})