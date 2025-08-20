import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: '/index.html',
        404: '/404.html'
      },
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-chart': ['chart.js', 'react-chartjs-2'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-ui': ['@headlessui/react', '@heroicons/react', 'framer-motion'],
          'vendor-utils': ['axios', 'date-fns'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-mp': ['@mercadopago/sdk-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit to 1MB
  }
})
