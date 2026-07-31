import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const packageRoot = __dirname

export default defineConfig({
  plugins: [vue()],
  build: {
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
      },
      format: {
        comments: false,
      },
      mangle: true,
    },
    lib: {
      cssFileName: 'datav',
      entry: {
        'active-ring-chart': resolve(packageRoot, 'src/components/LumalActiveRingChart.vue'),
        'border-box': resolve(packageRoot, 'src/components/LumalBorderBox.vue'),
        'capsule-chart': resolve(packageRoot, 'src/components/LumalCapsuleChart.vue'),
        'charts': resolve(packageRoot, 'src/components/LumalCharts.vue'),
        'conical-column-chart': resolve(packageRoot, 'src/components/LumalConicalColumnChart.vue'),
        'decoration': resolve(packageRoot, 'src/components/LumalDecoration.vue'),
        'digital-flop': resolve(packageRoot, 'src/components/LumalDigitalFlop.vue'),
        'flyline-chart': resolve(packageRoot, 'src/components/LumalFlylineChart.vue'),
        'flyline-chart-enhanced': resolve(packageRoot, 'src/components/LumalFlylineChartEnhanced.vue'),
        'full-screen-container': resolve(packageRoot, 'src/components/LumalFullScreenContainer.vue'),
        'index': resolve(packageRoot, 'src/index.ts'),
        'loading': resolve(packageRoot, 'src/components/LumalLoading.vue'),
        'percent-pond': resolve(packageRoot, 'src/components/LumalPercentPond.vue'),
        'scroll-board': resolve(packageRoot, 'src/components/LumalScrollBoard.vue'),
        'scroll-ranking-board': resolve(packageRoot, 'src/components/LumalScrollRankingBoard.vue'),
        'water-level-pond': resolve(packageRoot, 'src/components/LumalWaterLevelPond.vue'),
      },
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['echarts', 'vue'],
      output: {
        exports: 'named',
      },
    },
  },
})
