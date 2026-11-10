// G   itHub@St arsail sClover
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@lge/components': resolve(__dirname, '../../packages/lge-components/src/index.ts'),
      '@lge/core/shaders': resolve(__dirname, '../../packages/lge-core/src/shaders/index.ts'),
      '@lge/core': resolve(__dirname, '../../packages/lge-core/src/index.ts'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5175,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        components: resolve(__dirname, 'components.html'),
      },
    },
  },
});
