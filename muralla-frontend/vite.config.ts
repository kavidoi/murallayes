import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    open: false,
  },
  base: '/',
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-chart'
            }
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd'
            }
            if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('framer-motion')) {
              return 'vendor-ui'
            }
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils'
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n'
            }
            if (id.includes('@mercadopago')) {
              return 'vendor-mp'
            }
            return 'vendor-other'
          }
          
          // Split large feature modules
          if (id.includes('/modules/pipeline/PurchaseOrders')) {
            return 'feature-purchase-orders'
          }
          if (id.includes('/modules/pos/CashierPOS')) {
            return 'feature-cashier-pos'
          }
          if (id.includes('/modules/projects/TasksList')) {
            return 'feature-tasks'
          }
          if (id.includes('/modules/pipeline/ProductionWorkOrders')) {
            return 'feature-production'
          }
          if (id.includes('/modules/finance/Gastos')) {
            return 'feature-expenses'
          }
          if (id.includes('/modules/crm/')) {
            return 'feature-crm'
          }
          if (id.includes('/modules/pipeline/')) {
            return 'feature-pipeline'
          }
          if (id.includes('/modules/finance/')) {
            return 'feature-finance'
          }
          if (id.includes('/modules/projects/')) {
            return 'feature-projects'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit to 1MB
  }
})