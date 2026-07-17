<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineChartConfig } from '@luma/datav'
import { LumaFlylineChart } from '@luma/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
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

// 在线调试可调属性（centerPoint/points 为坐标数据，保持固定，仅暴露标量/颜色字段）
const playModel = reactive<Record<string, unknown>>({
  flylineColor: '#35c8ff',
  orbitColor: '#67e0e3',
  lineWidth: 1,
  curvature: 5,
})

const playControls: PlaygroundControl[] = [
  { key: 'flylineColor', label: '飞线色 flylineColor', type: 'color' },
  { key: 'orbitColor', label: '轨道色 orbitColor', type: 'color' },
  { key: 'lineWidth', label: '飞线宽度 lineWidth', type: 'number', min: 1, max: 6, step: 1 },
  { key: 'curvature', label: '飞线曲率 curvature', type: 'number', min: 1, max: 10, step: 1 },
]

// 把固定坐标数据与可调字段合并成一份 config 传给组件
const playConfig = computed<Partial<FlylineChartConfig>>(() => ({
  ...config,
  flylineColor: playModel.flylineColor as string,
  orbitColor: playModel.orbitColor as string,
  lineWidth: playModel.lineWidth as number,
  curvature: playModel.curvature as number,
}))

// 生成 config 用法代码（属性无法平铺表达，改为渲染完整 config 对象）
function playCodeGen(model: Record<string, unknown>): string {
  return `<LumaFlylineChart
  :config="{
    centerPoint: [0.5, 0.5],
    points: [/* ... */],
    flylineColor: '${model.flylineColor}',
    orbitColor: '${model.orbitColor}',
    lineWidth: ${model.lineWidth},
    curvature: ${model.curvature},
  }"
  style="height: 320px"
/>`
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
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaFlylineChart"
      :controls="playControls"
      :model-value="playModel"
      :min-height="380"
      :code-gen="playCodeGen"
    >
      <LumaFlylineChart :config="playConfig" style="height: 320px; width: 100%;" />
    </Playground>

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
