import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // React and the router change rarely, so they get their own file that browsers keep cached
        // when only our app code changes.
        manualChunks: { vendor: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'] },
      },
    },
  },
})
