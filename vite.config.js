import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    mkcert()
  ],
  server: {
    https: true,
    host: '0.0.0.0',
    allowedHosts: 'all',
    hmr: {
      overlay: false
    }
  },
  resolve: {
    extensions: ['.js']
  }
})