import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/  +  https://vitest.dev/config/
// PWA plugin is skipped under Vitest (it would build a service worker for tests).
const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
  manifest: {
    name: 'Benchmark Tracker',
    short_name: 'Benchmark',
    description: '12-week strength + hybrid running program tracker',
    theme_color: '#0b0b0c',
    background_color: '#0b0b0c',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})

export default defineConfig({
  plugins: [react(), ...(process.env.VITEST ? [] : [pwa])],
  test: {
    // lib/ is framework-free pure logic — node env is enough and fast.
    environment: 'node',
    include: ['lib/**/*.test.js', 'src/**/*.test.{js,jsx}'],
  },
})
