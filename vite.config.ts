import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // VORわかる？(5173) と同時に起動できるようポートを分ける。
  server: {
    port: 5174,
    strictPort: true,
  },
})
