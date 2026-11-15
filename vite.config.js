import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works at the GitHub Pages sub-path (/aua-jer/) and at the root alike.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2019', sourcemap: false }
});
