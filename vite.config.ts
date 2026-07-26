import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2020',
  },
});