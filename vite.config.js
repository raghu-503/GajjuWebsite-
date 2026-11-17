import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

const r = (p) => resolve(__dirname, 'src', p);

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  server: { port: 5173, open: true },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        index: r('index.html'),
        shop: r('shop.html'),
        product: r('product.html'),
        cart: r('cart.html'),
        checkout: r('checkout.html'),
      },
    },
  },
});
