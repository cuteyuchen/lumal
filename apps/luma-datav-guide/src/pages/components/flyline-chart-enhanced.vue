<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineEnhancedConfig } from '@luma/datav'
import { LumaFlylineChartEnhanced } from '@luma/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const config: FlylineEnhancedConfig = {
  points: [
    { name: '北京', coordinate: [0.5, 0.2] },
    { name: '上海', coordinate: [0.8, 0.5] },
    { name: '广州', coordinate: [0.6, 0.85] },
    { name: '成都', coordinate: [0.2, 0.6] },
  ],
  lines: [
    { source: '北京', target: '上海' },
    { source: '北京', target: '广州' },
    { source: '成都', target: '北京' },
  ],
  line: { color: '#35c8ff', width: 1 },
}

// 在线调试可调属性（points/lines 为拓扑数据，保持固定，仅暴露标量/颜色字段）
const playModel = reactive<Record<string, unknown>>({
  lineColor: '#35c8ff',
  lineWidth: 1,
  curvature: 5,
})

const playControls: PlaygroundControl[] = [
  { key: 'lineColor', label: '连线色 line.color', type: 'color' },
  { key: 'lineWidth', label: '连线宽度 line.width', type: 'number', min: 1, max: 6, step: 1 },
  { key: 'curvature', label: '连线曲率 curvature', type: 'number', min: 1, max: 10, step: 1 },
]

// 把固定拓扑数据与可调字段合并成一份 config 传给组件
const playConfig = computed<FlylineEnhancedConfig>(() => ({
  ...config,
  curvature: playModel.curvature as number,
  line: { color: playModel.lineColor as string, width: playModel.lineWidth as number },
}))

// 生成 config 用法代码（属性无法平铺表达，改为渲染完整 config 对象）
function playCodeGen(model: Record<string, unknown>): string {
  return `<LumaFlylineChartEnhanced
  :config="{
    points: [/* ... */],
    lines: [/* ... */],
    curvature: ${model.curvature},
    line: { color: '${model.lineColor}', width: ${model.lineWidth} },
  }"
  style="height: 340px"
/>`
}

const code = `<script setup lang="ts">
import { LumaFlylineChartEnhanced } from '@luma/datav'

const config = {
  points: [
    { name: '北京', coordinate: [0.5, 0.2] },
    { name: '上海', coordinate: [0.8, 0.5] },
    { name: '广州', coordinate: [0.6, 0.85] },
    { name: '成都', coordinate: [0.2, 0.6] },
  ],
  lines: [
    { source: '北京', target: '上海' },
    { source: '北京', target: '广州' },
    { source: '成都', target: '北京' },
  ],
  line: { color: '#35c8ff', width: 1 },
}
<\/script>

<template>
  <LumaFlylineChartEnhanced :config="config" style="height: 340px" />
<\/template>`

const propRows: PropRow[] = [
  { name: 'config', type: 'FlylineEnhancedConfig', description: '增强飞线配置，支持任意起止点连线。' },
  { name: 'ariaLabel', type: 'string', default: "'增强飞线图'", description: '无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'points', type: 'FlylineEnhancedPoint[]', description: '命名坐标点：name + coordinate。' },
  { name: 'lines', type: 'FlylineEnhancedLine[]', description: '连线：source/target 指向 point 名称。' },
  { name: 'line', type: 'FlylineLineStyle', description: '连线默认样式（可被单条 line 覆盖）。' },
  { name: 'halo', type: 'FlylineHaloStyle', description: '点光晕样式。' },
  { name: 'icon', type: 'FlylineIconStyle', description: '点图标样式。' },
  { name: 'text', type: 'FlylineTextStyle', description: '点文字样式。' },
  { name: 'bgImgSrc', type: 'string', description: '背景图地址。' },
  { name: 'curvature', type: 'number', description: '连线曲率。' },
  { name: 'relative', type: 'boolean', description: '坐标是否相对容器。' },
]
</script>

<template>
  <ComponentDoc
    title="FlylineChartEnhanced 增强飞线"
    component-name="LumaFlylineChartEnhanced"
    datav-name="flylineChartEnhanced"
    intro="相比基础飞线，增强版支持任意起止点连线（source/target 指向命名点），适合多对多网络关系。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaFlylineChartEnhanced"
      :controls="playControls"
      :model-value="playModel"
      :min-height="400"
      :code-gen="playCodeGen"
    >
      <LumaFlylineChartEnhanced :config="playConfig" style="height: 340px; width: 100%;" />
    </Playground>

    <DemoBlock
      title="任意起止点飞线"
      description="points 定义命名坐标，lines 用 source/target 指向点名称组织连线。"
      :code="code"
      :min-height="380"
    >
      <LumaFlylineChartEnhanced :config="config" style="height: 340px" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />
  </ComponentDoc>
</template>
