import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Respeita a porta atribuída pelo ambiente (ex.: preview do Claude Code).
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // As specs de e2/ rodam no Playwright, com outro runner e outras APIs.
    exclude: ['node_modules/**', 'dist/**', 'android/**', 'ios/**', 'e2e/**'],
  },
})
