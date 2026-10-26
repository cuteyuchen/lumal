import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/***********************应用开发配置*********************/
export default defineConfig({
  plugins: [vue()],
  // manifest 用于核对路由懒加载和初始资源体积。
  build: {
    manifest: true,
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              entriesAware: true,
              maxSize: 420 * 1024,
              name: 'vendor-element-plus',
              priority: 40,
              test: /node_modules[\\/]element-plus[\\/]/,
            },
            {
              entriesAware: true,
              maxSize: 420 * 1024,
              name: 'vendor-vue',
              priority: 30,
              test: /node_modules[\\/](?:@vue|vue|vue-router)[\\/]/,
            },
            {
              entriesAware: true,
              maxSize: 420 * 1024,
              name: 'vendor-lumal',
              priority: 20,
              test: /node_modules[\\/]@lumal[\\/]/,
            },
            {
              entriesAware: true,
              maxSize: 420 * 1024,
              name: 'vendor',
              priority: 10,
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
