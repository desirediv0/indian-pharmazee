
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Add the preview configuration for production builds
  preview: {
    port: 5001,
    host: "0.0.0.0",
    allowedHosts: [
      "partner.indianpharmazee.com",
      "www.partner.indianpharmazee.com",
    ],
  },
  // Add server configuration for development
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: [
      "partner.indianpharmazee.com",
      "www.partner.indianpharmazee.com",
    ],
  },
})
