import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Single-page React app: every route is served by src/index.html. Hosts need an SPA
  // fallback (serve index.html for unknown paths); `vite` and `vite preview` do this already.
  base: '/',
  plugins: [react(), tailwindcss()],
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  server: { port: 5173, open: true },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
});
