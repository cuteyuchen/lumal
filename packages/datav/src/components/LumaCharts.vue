<script setup lang="ts">
import type {
  EChartsInitOpts,
  EChartsOption,
  EChartsType,
  ResizeOpts,
  SetOptionOpts,
} from 'echarts'
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, shallowRef, useAttrs, useTemplateRef, watch, watchEffect } from 'vue'

type EChartsEventHandler = (...args: unknown[]) => void

const props = withDefaults(defineProps<{
  option?: EChartsOption
  theme?: string | object | null
  initOptions?: EChartsInitOpts
  setOptionOptions?: SetOptionOpts
  autoResize?: boolean
  events?: Readonly<Record<string, EChartsEventHandler>>
  group?: string
  loading?: boolean
  loadingType?: string
  loadingOptions?: object
  ariaLabel?: string
}>(), {
  ariaLabel: 'ECharts 图表',
  autoResize: true,
  events: () => ({}),
  group: undefined,
  initOptions: undefined,
  loading: false,
  loadingOptions: undefined,
  loadingType: 'default',
  option: () => ({}),
  setOptionOptions: undefined,
  theme: undefined,
})

const attrs = useAttrs()
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const chartRef = shallowRef<EChartsType>()
const attachedEvents = new Map<string, EChartsEventHandler>()
let resizeObserver: ResizeObserver | undefined
let resizeFrame = 0

function attrEventName(key: string): string | undefined {
  if (!key.startsWith('on') || key.length <= 2)
    return undefined
  return key.slice(2).toLowerCase()
}

function resolvedEvents(): Map<string, EChartsEventHandler> {
  const result = new Map<string, EChartsEventHandler>()
  Object.entries(props.events).forEach(([name, handler]) => result.set(name.toLowerCase(), handler))
  Object.entries(attrs).forEach(([key, value]) => {
    const name = attrEventName(key)
    if (name && typeof value === 'function')
      result.set(name, value as EChartsEventHandler)
  })
  return result
}

function syncEvents(): void {
  const chart = chartRef.value
  if (!chart)
    return
  attachedEvents.forEach((handler, name) => chart.off(name, handler))
  attachedEvents.clear()
  resolvedEvents().forEach((handler, name) => {
    chart.on(name, handler)
    attachedEvents.set(name, handler)
  })
}

function scheduleResize(options?: ResizeOpts): void {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => chartRef.value?.resize(options))
}

function createChart(): void {
  const element = rootRef.value
  if (!element || !element.clientWidth || !element.clientHeight)
    return
  chartRef.value?.dispose()
  const chart = echarts.init(element, props.theme, props.initOptions)
  chartRef.value = chart
  if (props.group)
    chart.group = props.group
  applyOption(props.option)
  syncEvents()
  if (props.loading)
    chart.showLoading(props.loadingType, props.loadingOptions)
}

function applyOption(option: EChartsOption): void {
  const chart = chartRef.value
  if (!chart)
    return
  if (props.setOptionOptions)
    chart.setOption(option, props.setOptionOptions)
  else
    chart.setOption(option)
}

watch(() => props.option, applyOption, { deep: false })
watch(() => props.group, (group) => {
  if (chartRef.value)
    chartRef.value.group = group ?? ''
})
watchEffect(() => {
  Object.keys(attrs)
  void props.events
  syncEvents()
})
watch(() => props.loading, (loading) => {
  const chart = chartRef.value
  if (!chart)
    return
  if (loading)
    chart.showLoading(props.loadingType, props.loadingOptions)
  else
    chart.hideLoading()
})
watch(() => [props.theme, props.initOptions] as const, () => void nextTick(createChart), { deep: false })

onMounted(async () => {
  await nextTick()
  if (props.autoResize && rootRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (chartRef.value)
        scheduleResize()
      else
        createChart()
    })
    resizeObserver.observe(rootRef.value)
  }
  createChart()
  if (!chartRef.value)
    resizeFrame = requestAnimationFrame(createChart)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  attachedEvents.clear()
  chartRef.value?.dispose()
  chartRef.value = undefined
})

defineExpose({
  appendData: (...args: Parameters<EChartsType['appendData']>) => chartRef.value?.appendData(...args),
  clear: () => chartRef.value?.clear(),
  containPixel: (...args: Parameters<EChartsType['containPixel']>) => chartRef.value?.containPixel(...args),
  convertFromPixel: (...args: Parameters<EChartsType['convertFromPixel']>) => chartRef.value?.convertFromPixel(...args),
  convertToPixel: (...args: Parameters<EChartsType['convertToPixel']>) => chartRef.value?.convertToPixel(...args),
  dispatchAction: (...args: Parameters<EChartsType['dispatchAction']>) => chartRef.value?.dispatchAction(...args),
  dispose: () => chartRef.value?.dispose(),
  getConnectedDataURL: (...args: Parameters<EChartsType['getConnectedDataURL']>) => chartRef.value?.getConnectedDataURL(...args),
  getDataURL: (...args: Parameters<EChartsType['getDataURL']>) => chartRef.value?.getDataURL(...args),
  getHeight: () => chartRef.value?.getHeight(),
  getInstance: () => chartRef.value,
  getOption: () => chartRef.value?.getOption(),
  getWidth: () => chartRef.value?.getWidth(),
  hideLoading: () => chartRef.value?.hideLoading(),
  off: (...args: Parameters<EChartsType['off']>) => chartRef.value?.off(...args),
  on: (...args: Parameters<EChartsType['on']>) => chartRef.value?.on(...args),
  resize: (options?: ResizeOpts) => scheduleResize(options),
  setOption: (option: EChartsOption, options?: SetOptionOpts) => chartRef.value?.setOption(option, options),
  showLoading: (...args: Parameters<EChartsType['showLoading']>) => chartRef.value?.showLoading(...args),
})
</script>

<template>
  <div ref="rootRef" class="luma-charts" role="img" :aria-label="ariaLabel" />
</template>

<style scoped>
.luma-charts { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; }
</style>
