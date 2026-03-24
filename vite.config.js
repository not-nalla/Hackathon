import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['unpoeticized-anton-merely.ngrok-free.dev', '.ngrok-free.dev', 'all']
  }
})
