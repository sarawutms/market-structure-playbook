import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /market-structure-playbook/ (GitHub
  // lowercases repo names); use a root base everywhere else.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/market-structure-playbook/' : '/',
  plugins: [react(), tailwindcss()],
})
