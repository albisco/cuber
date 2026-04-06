import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-ignore — vitest extends vite config with `test` field
  test: {
    environment: 'node',
    globals: true,
  },
})
