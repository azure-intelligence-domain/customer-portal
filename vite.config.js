import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Relative asset paths and hash routes: the same build runs on the Azure Storage static website
// (at /) and on GitHub Pages (at /customer-portal/).
export default defineConfig({
  base: './',
  plugins: [vue()],
  test: { environment: 'node' },
})
