<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineEnhancedConfig } from '@luma/datav'
import { LumaFlylineChartEnhanced } from '@luma/datav'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
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
