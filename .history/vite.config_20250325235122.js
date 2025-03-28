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
    allowedHosts: 'all',
    hmr: {
      // Configure HMR to use a different protocol or port
      // or disable the overlay
      overlay: false
    }
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }

})