import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  mode: 'production',
  build: {
    outDir: '../qoracrm/dist',
    emptyOutDir: true,
    minify: 'oxc',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  oxc: {
    transform: {
      target: 'es2020'
    }
  }
})

