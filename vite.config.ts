import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /Market-Structure-Playbook/; use a
  // root base everywhere else (Vercel, Netlify, local dev, …).
  base: process.env.GITHUB_ACTIONS === 'true' ? '/Market-Structure-Playbook/' : '/',
  plugins: [react(), tailwindcss()],
})
