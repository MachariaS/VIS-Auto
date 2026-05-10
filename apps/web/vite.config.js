import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vis/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
    // Rollup resolves deps starting from the importing file's directory.
    // Files in packages/core (outside the root) can't walk up to find
    // node_modules on their own. These absolute paths cover both cases:
    //   LOCAL  – workspace hoists packages to the repo root node_modules
    //   VERCEL – isolated `cd apps/web && npm ci` puts them in apps/web/node_modules
    modules: [
      resolve(__dirname, 'node_modules'),
      resolve(__dirname, '../../node_modules'),
      'node_modules',
    ],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
