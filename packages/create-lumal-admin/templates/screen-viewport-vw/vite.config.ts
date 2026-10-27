import { fileURLToPath, URL } from 'node:url';
import { createViewportTransformPlugin } from '@lumal/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { viewportDesign } from './viewport.config';

export default defineConfig({
  plugins: [
    vue(),
    createViewportTransformPlugin({
      enabled: true,
      include: ['src/screen/**'],
      viewportWidth: viewportDesign.designWidth,
      // 仅在 LumalViewport 的 vw 范围生效；其他模式恢复 px，避免再次缩放。
      output: 'runtime',
      inlineStyles: true,
      fontSize: false,
      minSize: false,
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { manifest: true },
});
