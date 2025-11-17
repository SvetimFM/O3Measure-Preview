import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
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

    build: {
      // Production build optimizations for Meta Quest
      target: 'es2020', // Modern target for better performance
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // Source maps only in development
      minify: isProduction ? 'terser' : false,

      // Terser options for aggressive optimization
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.trace'],
          passes: 2 // Multiple passes for better compression
        },
        format: {
          comments: false // Remove all comments
        },
        mangle: {
          safari10: true // Fix Safari 10/11 bugs
        }
      } : {},

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,

      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            'vendor-aframe': ['aframe'],
            'vendor-three': ['three']
          },
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            let extType = info[info.length - 1];

            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'images';
            } else if (/woff2?|ttf|eot/i.test(extType)) {
              extType = 'fonts';
            }

            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },

      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },

    // Optimizations
    optimizeDeps: {
      include: ['aframe', 'three'],
      exclude: []
    },

    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@state': path.resolve(__dirname, './src/state'),
        '@scenes': path.resolve(__dirname, './src/scenes')
      }
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction
    },

    // Performance
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      legalComments: 'none'
    },

    // Preview server (for production testing)
    preview: {
      host: '0.0.0.0',
      port: 4173,
      https: true
    }
  };
})