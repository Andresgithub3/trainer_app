import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/  +  https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // lib/ is framework-free pure logic — node env is enough and fast.
    // Switch to 'jsdom' when component tests arrive (step 5).
    environment: 'node',
    include: ['lib/**/*.test.js', 'src/**/*.test.{js,jsx}'],
  },
})
