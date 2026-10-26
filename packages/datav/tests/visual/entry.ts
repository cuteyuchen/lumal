import type { EChartsType } from 'echarts'
import { createApp } from 'vue'
import VariantGallery from './VariantGallery.vue'
import '../../src/source-style.css'

interface ChartVisualState {
  ready: boolean
  width: number
  height: number
  hostWidth: number
  hostHeight: number
}

declare global {
  interface Window {
    lumalDatavVisual: { getChartStates: () => ChartVisualState[] }
  }
}

createApp(VariantGallery).mount('#app')

// 仅在测试入口读取 ECharts 公开实例，不创建实例、不改配置或生产组件的加载边界。
let findChart: ((element: HTMLElement) => EChartsType | undefined) | undefined
window.lumalDatavVisual = {
  getChartStates: () => Array.from(document.querySelectorAll<HTMLElement>('.lumal-charts__host'), (host) => {
    const chart = findChart?.(host)
    return {
      ready: Boolean(chart && !chart.isDisposed() && chart.getOption().animation === false),
      width: chart?.getWidth() ?? 0,
      height: chart?.getHeight() ?? 0,
      hostWidth: Math.floor(host.clientWidth),
      hostHeight: Math.floor(host.clientHeight),
    }
  }),
}
void import('echarts').then((runtime) => {
  findChart = runtime.getInstanceByDom
})
