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

const cooperative: ViewportTransformOptions = {
  enabled: true,
  include: ['src/cooperative/**'],
  viewportWidth: design.designWidth,
  output: 'runtime',
  inlineStyles: true,
  fontSize: false,
  minSize: false,
  excludeProperties: ['border*'],
}

const fullPage: ViewportTransformOptions = {
  enabled: true,
  include: ['src/full-page/**'],
  output: 'runtime',
  viewportWidth: design.designWidth,
  inlineStyles: true,
  fontSize: true,
  minSize: true,
  customProperties: true,
  variableFallbacks: true,
  minPixelValue: 0,
  mediaQueries: { runtimeSelector: 'html[data-consumer-viewport="vw"]' },
}

export default defineConfig({
  plugins: [createViewportTransformPlugin(viewport), createViewportTransformPlugin(cooperative), createViewportTransformPlugin(fullPage), vue()],
  build: { minify: false, cssMinify: false, sourcemap: true },
})
