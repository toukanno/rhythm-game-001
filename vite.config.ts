import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Capacitor: relative paths, Vercel/default: root, GitHub Pages: subdirectory
  base: mode === 'capacitor' ? './' : mode === 'ghpages' ? '/rhythm-game-001/' : '/',
}));

