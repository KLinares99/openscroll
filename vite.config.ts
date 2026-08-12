import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is deploy-dependent: '/openscroll/' on GitHub Pages under a repo of
// that name, '/' for a custom domain. Override with OPENSCROLL_BASE at build time.
export default defineConfig({
  base: process.env.OPENSCROLL_BASE ?? '/openscroll/',
  plugins: [react()],
})
