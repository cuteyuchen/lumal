import type { ViewportTransformOptions } from '@lumal/vite'
import { createViewportTransformPlugin } from '@lumal/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { design } from './viewport.config'

const viewport: ViewportTransformOptions = {
  enabled: true,
  include: ['src/screen/**', 'src/runtime/**'],
  exclude: ['src/runtime/**'],
  viewportWidth: design.designWidth,
  fontSize: false,
  inlineStyles: true,
  excludeProperties: ['border*', 'margin*'],
  excludeSelectors: [
    '.map-panel',
    '.viewport-fixed',
    '[data-fixed="yes"]',
    '.style-presence-inline[style]',
    '[style="width: 384px; height: 192px"]',
  ],
}

export default defineConfig({
  plugins: [createViewportTransformPlugin(viewport), vue()],
  build: { minify: false, cssMinify: false, sourcemap: true },
})
