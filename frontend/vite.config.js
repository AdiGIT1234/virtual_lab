import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three':    ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          'vendor-avr':      ['avr8js'],
          'vendor-wokwi':    ['@wokwi/elements'],
          'vendor-motion':   ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
