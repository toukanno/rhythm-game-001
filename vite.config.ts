import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Use relative paths for Capacitor (cap build), absolute for GitHub Pages
  base: mode === 'capacitor' ? './' : '/rhythm-game-001/',
}));
