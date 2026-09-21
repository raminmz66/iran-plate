/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/iran-plate/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tessdata/fas.traineddata.gz'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,gz}'],
      },
      manifest: {
        name: 'پلاک‌یاب ایران',
        short_name: 'پلاک‌یاب',
        description: 'تشخیص شهر و استان پلاک خودروهای ایران',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#315d77',
        background_color: '#edf3f5',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
