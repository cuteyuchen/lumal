<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineChartConfig } from '@luma/datav'
import { LumaFlylineChart } from '@luma/datav'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const config: Partial<FlylineChartConfig> = {
  centerPoint: [0.5, 0.5],
  points: [
    { position: [0.22, 0.28], text: '北京' },
    { position: [0.78, 0.32], text: '上海' },
    { position: [0.68, 0.82], text: '广州' },
    { position: [0.2, 0.78], text: '成都' },
  ],
  flylineColor: '#35c8ff',
  orbitColor: 'rgb(103 224 227 / 30%)',
}

const code = `<script setup lang="ts">
import { LumaFlylineChart } from '@luma/datav'

const config = {
  centerPoint: [0.5, 0.5],
  points: [
    { position: [0.22, 0.28], text: '北京' },
    { position: [0.78, 0.32], text: '上海' },
    { position: [0.68, 0.82], text: '广州' },
  ],
  flylineColor: '#35c8ff',
  orbitColor: 'rgb(103 224 227 / 30%)',
}
<\/script>

<template>
  <LumaFlylineChart :config="config" style="height: 320px" />
<\/template>`

const propRows: PropRow[] = [
  { name: 'config', type: 'Partial<FlylineChartConfig>', description: '飞线配置，中心点向各点辐射飞线。' },
  { name: 'dev', type: 'boolean', default: 'false', description: '开发模式，配合 position 事件标定坐标。' },
  { name: 'ariaLabel', type: 'string', default: "'飞线图'", description: '无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'centerPoint', type: '[number, number]', description: '中心点相对坐标（0~1）。' },
  { name: 'points', type: 'FlylineChartPoint[]', description: '飞线终点，position + 可选 text。' },
  { name: 'bgImgUrl', type: 'string', description: '背景图地址。' },
  { name: 'flylineColor', type: 'string', description: '飞线颜色。' },
  { name: 'orbitColor', type: 'string', description: '轨道颜色。' },
  { name: 'lineWidth', type: 'number', description: '飞线宽度。' },
  { name: 'curvature', type: 'number', description: '飞线曲率。' },
  { name: 'duration', type: '[number, number]', description: '飞线时长区间。' },
  { name: 'halo', type: 'FlylineChartHaloStyle', description: '终点光晕样式。' },
  { name: 'text', type: 'FlylineTextStyle', description: '终点文字样式。' },
  { name: 'relative', type: 'boolean', description: '坐标是否相对容器。' },
]
</script>

<template>
  <ComponentDoc
    title="FlylineChart 飞线图"
    component-name="LumaFlylineChart"
    datav-name="flylineChart"
    intro="中心点向多个终点辐射的飞线动画，使用响应式 SVG 与 SMIL 重构，坐标使用相对比例。"
  >
    <DemoBlock
      title="中心辐射飞线"
      description="centerPoint 为中心，points 为各辐射终点，坐标均为 0~1 相对值。"
      :code="code"
      :min-height="360"
    >
      <LumaFlylineChart :config="config" style="height: 320px" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />
  </ComponentDoc>
</template>
