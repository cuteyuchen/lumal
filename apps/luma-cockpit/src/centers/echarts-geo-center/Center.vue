<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { ComponentPublicInstance } from 'vue'
import type { SceneCenterRendererProps } from '../types'
import { useChartResize } from '@luma/charts'
import { EffectScatterChart, LinesChart, MapChart } from 'echarts/charts'
import { AriaComponent, GeoComponent, TooltipComponent } from 'echarts/components'
import { registerMap, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, useTemplateRef } from 'vue'
import VChart from 'vue-echarts'
import { demoScene, getSceneEntity } from '../../data/demo-scene'

/***********************ECharts 中国飞线中央组件*********************/

const props = defineProps<SceneCenterRendererProps>()
const emit = defineEmits<{
  select: [id: string]
}>()

const MAP_NAME = 'luma-china-scene'
use([
  CanvasRenderer,
  AriaComponent,
  GeoComponent,
  TooltipComponent,
  MapChart,
  EffectScatterChart,
  LinesChart,
])
registerMap(MAP_NAME, demoScene.geoJson as never)

const chartRef = useTemplateRef<ComponentPublicInstance & { resize: () => void }>('chartRef')
const updateOptions: SetOptionOpts = { notMerge: false }
const isDark = computed(() => props.theme === 'dark')
const regionByName = new Map(demoScene.regions.map(region => [region.name, region]))

function isSelected(id: string): boolean {
  return props.selectedIds.includes(id) || props.focusedId === id
}

function statusOpacity(status?: string): number {
  return !props.filterStatus || props.filterStatus === status ? 1 : 0.16
}

const option = computed<EChartsOption>(() => {
  const accent = isDark.value ? '#20c7ff' : '#087faf'
  const bright = isDark.value ? '#78e8ff' : '#036f9c'
  const baseArea = isDark.value ? '#071a36' : '#d8edf6'
  const selectedArea = isDark.value ? '#0b5978' : '#98d9e9'
  const border = isDark.value ? '#43d8ff' : '#178eb8'
  const text = isDark.value ? '#e8fbff' : '#10394b'
  const mutedText = isDark.value ? 'rgba(216, 246, 255, 0.76)' : 'rgba(16, 57, 75, 0.76)'

  const routeData = demoScene.lines.map(line => ({
    id: line.id,
    name: `${getSceneEntity(line.fromId)?.name ?? ''} - ${getSceneEntity(line.toId)?.name ?? ''}`,
    coords: line.coordinates,
    value: line.value,
    lineStyle: {
      opacity: statusOpacity(line.status) * (isSelected(line.toId) ? 0.9 : 0.34),
      width: isSelected(line.toId) ? 1.8 : 0.9,
    },
  }))

  return {
    backgroundColor: 'transparent',
    animation: !props.reducedMotion,
    animationDurationUpdate: props.reducedMotion ? 0 : 240,
    aria: {
      enabled: true,
      label: {
        description: '全国运行态势飞线图，展示省级区域、业务节点和武汉中心辐射链路。',
      },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: isDark.value ? 'rgba(3, 18, 38, 0.94)' : 'rgba(247, 252, 255, 0.98)',
      borderColor: isDark.value ? 'rgba(67, 216, 255, 0.56)' : 'rgba(23, 142, 184, 0.38)',
      textStyle: { color: text },
      formatter(params: unknown) {
        const item = params as { data?: { id?: string, name?: string, value?: number | number[] }, name?: string }
        const entity = getSceneEntity(item.data?.id)
        const rawValue = Array.isArray(item.data?.value) ? item.data.value[2] : item.data?.value
        const name = entity?.name ?? item.data?.name ?? item.name ?? ''
        return `${name}<br/>运行指数：${entity?.value ?? rawValue ?? '-'}`
      },
    },
    geo: {
      map: MAP_NAME,
      roam: true,
      layoutCenter: ['50%', '50%'],
      layoutSize: '95%',
      scaleLimit: { min: 0.9, max: 5 },
      itemStyle: {
        areaColor: baseArea,
        borderColor: border,
        borderWidth: 1,
        shadowBlur: isDark.value ? 10 : 4,
        shadowColor: isDark.value ? 'rgba(32, 199, 255, 0.68)' : 'rgba(8, 127, 175, 0.28)',
      },
      emphasis: {
        itemStyle: {
          areaColor: selectedArea,
          borderColor: bright,
          borderWidth: 1.6,
        },
        label: { color: text },
      },
      label: {
        show: true,
        color: mutedText,
        fontSize: 10,
      },
      regions: demoScene.regions.map(region => ({
        name: region.name,
        itemStyle: {
          areaColor: isSelected(region.id) ? selectedArea : baseArea,
          borderColor: isSelected(region.id) ? bright : border,
          borderWidth: isSelected(region.id) ? 1.8 : 1,
          opacity: statusOpacity(region.status),
        },
      })),
    },
    series: [
      {
        name: '省级态势',
        type: 'map',
        map: MAP_NAME,
        geoIndex: 0,
        data: demoScene.regions.map(region => ({
          id: region.id,
          name: region.name,
          value: region.value,
        })),
      },
      {
        name: '链路底线',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        silent: true,
        zlevel: 2,
        lineStyle: {
          color: accent,
          opacity: 0.28,
          width: 0.9,
        },
        data: routeData,
      },
      {
        name: '实时飞线',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        silent: true,
        zlevel: 3,
        effect: {
          show: !props.reducedMotion,
          period: 4.8,
          trailLength: 0.32,
          symbol: 'arrow',
          symbolSize: 5,
          color: bright,
        },
        lineStyle: {
          color: accent,
          opacity: 0.28,
          width: 0.8,
        },
        data: routeData,
      },
      {
        name: '业务节点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 4,
        showEffectOn: 'render',
        symbolSize(value: unknown, params: unknown) {
          const numeric = Array.isArray(value) ? Number(value[2]) : 70
          const item = params as { data?: { id?: string } }
          return (isSelected(item.data?.id ?? '') ? 4 : 0) + Math.max(7, Math.min(13, numeric / 8))
        },
        rippleEffect: {
          brushType: 'stroke',
          scale: props.reducedMotion ? 1 : 2.8,
        },
        itemStyle: {
          color: isDark.value ? '#ffc857' : '#b77900',
          shadowBlur: 10,
          shadowColor: isDark.value ? 'rgba(255, 200, 87, 0.48)' : 'rgba(183, 121, 0, 0.28)',
        },
        emphasis: {
          itemStyle: { color: isDark.value ? '#00e5a0' : '#00966d' },
        },
        data: demoScene.points.map(point => ({
          id: point.id,
          name: point.name,
          value: [...point.coordinate, point.value],
          itemStyle: {
            color: isSelected(point.id) ? (isDark.value ? '#00e5a0' : '#00966d') : undefined,
            opacity: statusOpacity(point.status),
          },
        })),
      },
    ],
  }
})

function handleChartClick(params: unknown): void {
  const event = params as { data?: { id?: string } | null, name?: string }
  const id = event.data?.id ?? (event.name ? regionByName.get(event.name)?.id : undefined)
  if (id && getSceneEntity(id))
    emit('select', id)
}

useChartResize(chartRef)
</script>

<template>
  <div class="echarts-geo-center" data-center-renderer="echarts">
    <VChart
      ref="chartRef"
      class="echarts-geo-center__chart"
      :option="option"
      :update-options="updateOptions"
      autoresize
      role="img"
      aria-label="全国运行态势 ECharts 飞线图"
      @click="handleChartClick"
    />
  </div>
</template>

<style scoped>
.echarts-geo-center,
.echarts-geo-center__chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
