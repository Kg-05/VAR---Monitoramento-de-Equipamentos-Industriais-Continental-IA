import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    coverage:    { reporter: ['text', 'html'] },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
