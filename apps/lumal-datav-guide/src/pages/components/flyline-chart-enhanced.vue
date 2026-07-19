<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineCoordinate, FlylineEnhancedConfig, FlylineEnhancedLine, FlylineEnhancedPoint } from '@lumal/datav'
import { LumalFlylineChartEnhanced } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const chartWidth = 741
const chartHeight = 600
const mapUrl = '/img/flylineChart/map.jpg'
const pointIconUrl = '/img/flylineChart/mapPoint.png'

const officialPoints: readonly FlylineEnhancedPoint[] = [
  { name: '郑州', coordinate: [0.48, 0.35] },
  { name: '新乡', coordinate: [0.52, 0.23] },
  { name: '焦作', coordinate: [0.43, 0.29] },
  { name: '开封', coordinate: [0.59, 0.35] },
  { name: '许昌', coordinate: [0.53, 0.47] },
  { name: '平顶山', coordinate: [0.45, 0.54] },
  { name: '洛阳', coordinate: [0.36, 0.38] },
  { name: '周口', coordinate: [0.62, 0.55] },
  { name: '漯河', coordinate: [0.56, 0.56] },
  { name: '南阳', coordinate: [0.37, 0.66] },
  { name: '信阳', coordinate: [0.55, 0.81] },
  { name: '驻马店', coordinate: [0.55, 0.67] },
  { name: '济源', coordinate: [0.37, 0.29] },
  { name: '三门峡', coordinate: [0.20, 0.36] },
  { name: '商丘', coordinate: [0.76, 0.41] },
  { name: '鹤壁', coordinate: [0.59, 0.18] },
  { name: '濮阳', coordinate: [0.68, 0.17] },
  { name: '安阳', coordinate: [0.59, 0.10] },
]

const officialLines: readonly FlylineEnhancedLine[] = officialPoints.slice(1).map(point => ({
  source: point.name,
  target: '郑州',
}))

// DataV 官方文档「基本示例」。
const config: FlylineEnhancedConfig = {
  points: officialPoints,
  lines: officialLines,
  bgImgSrc: mapUrl,
}

const playModel = reactive<Record<string, unknown>>({
  ariaLabel: 'DataV 官方河南增强飞线图',
  dev: false,
  pointCount: officialPoints.length,
  lineCount: officialLines.length,
  relative: true,
  showBackground: true,
  bgImgSrc: mapUrl,
  k: -0.5,
  curvature: 5,
  lineColor: '#ffde93',
  orbitColor: 'rgba(103, 224, 227, .2)',
  lineWidth: 1,
  lineDurationMin: 20,
  lineDurationMax: 30,
  lineRadius: 100,
  showHalo: false,
  haloDurationMin: 20,
  haloDurationMax: 30,
  haloColor: '#fb7293',
  haloRadius: 120,
  showIcon: false,
  iconSrc: pointIconUrl,
  iconWidth: 15,
  iconHeight: 15,
  showText: false,
  textColor: '#ffdb5c',
  textFontSize: 12,
  textOffsetX: 0,
  textOffsetY: 15,
})

const playControls: PlaygroundControl[] = [
  { key: 'ariaLabel', label: '无障碍标签 ariaLabel', type: 'text', omitFromCode: true },
  { key: 'dev', label: '开发坐标模式 dev', type: 'boolean', omitFromCode: true },
  { key: 'pointCount', label: '点数量 points', type: 'number', min: 2, max: officialPoints.length, step: 1, omitFromCode: true },
  { key: 'lineCount', label: '飞线数量 lines', type: 'number', min: 1, max: officialLines.length, step: 1, omitFromCode: true },
  { key: 'relative', label: '相对坐标 relative', type: 'boolean', omitFromCode: true, hint: '关闭后自动换算为 741 × 600 示例的像素坐标。' },
  { key: 'showBackground', label: '显示背景图', type: 'boolean', omitFromCode: true },
  { key: 'bgImgSrc', label: '背景图 bgImgSrc', type: 'text', omitFromCode: true, hidden: model => !model.showBackground },
  { key: 'k', label: '收束程度 k', type: 'number', min: -1, max: 1, step: 0.1, omitFromCode: true },
  { key: 'curvature', label: '曲率 curvature', type: 'number', min: 1, max: 10, step: 1, omitFromCode: true },
  { key: 'lineColor', label: '飞线色 line.color', type: 'color', omitFromCode: true },
  { key: 'orbitColor', label: '轨道色 line.orbitColor', type: 'text', omitFromCode: true },
  { key: 'lineWidth', label: '线宽 line.width', type: 'number', min: 1, max: 8, step: 1, omitFromCode: true },
  { key: 'lineDurationMin', label: '最短时长 line.duration[0]', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true },
  { key: 'lineDurationMax', label: '最长时长 line.duration[1]', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true },
  { key: 'lineRadius', label: '显示半径 line.radius', type: 'number', min: 20, max: 240, step: 10, omitFromCode: true },
  { key: 'showHalo', label: '显示点光晕 halo.show', type: 'boolean', omitFromCode: true },
  { key: 'haloDurationMin', label: '光晕最短时长', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'haloDurationMax', label: '光晕最长时长', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'haloColor', label: '光晕色 halo.color', type: 'color', omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'haloRadius', label: '光晕半径 halo.radius', type: 'number', min: 10, max: 240, step: 10, omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'showIcon', label: '显示点图标 icon.show', type: 'boolean', omitFromCode: true },
  { key: 'iconSrc', label: '图标地址 icon.src', type: 'text', omitFromCode: true, hidden: model => !model.showIcon },
  { key: 'iconWidth', label: '图标宽度 icon.width', type: 'number', min: 4, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showIcon },
  { key: 'iconHeight', label: '图标高度 icon.height', type: 'number', min: 4, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showIcon },
  { key: 'showText', label: '显示点名称 text.show', type: 'boolean', omitFromCode: true },
  { key: 'textColor', label: '文本色 text.color', type: 'color', omitFromCode: true, hidden: model => !model.showText },
  { key: 'textFontSize', label: '字号 text.fontSize', type: 'number', min: 8, max: 28, step: 1, omitFromCode: true, hidden: model => !model.showText },
  { key: 'textOffsetX', label: '文本偏移 X', type: 'number', min: -60, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showText },
  { key: 'textOffsetY', label: '文本偏移 Y', type: 'number', min: -60, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showText },
]

function toCoordinate(coordinate: FlylineCoordinate, relative: boolean): FlylineCoordinate {
  if (relative)
    return coordinate
  return [
    Number((coordinate[0] * chartWidth).toFixed(2)),
    Number((coordinate[1] * chartHeight).toFixed(2)),
  ]
}

const playConfig = computed<FlylineEnhancedConfig>(() => {
  const relative = Boolean(playModel.relative)
  const pointCount = Math.max(2, Math.min(officialPoints.length, Number(playModel.pointCount)))
  const points = officialPoints.slice(0, pointCount).map(point => ({
    ...point,
    coordinate: toCoordinate(point.coordinate, relative),
  }))
  const visibleNames = new Set(points.map(point => point.name))
  const availableLines = officialLines.filter(line => visibleNames.has(line.source) && visibleNames.has(line.target))
  const lineCount = Math.max(1, Math.min(availableLines.length, Number(playModel.lineCount)))

  return {
    points,
    lines: availableLines.slice(0, lineCount),
    bgImgSrc: playModel.showBackground ? String(playModel.bgImgSrc) : '',
    k: Number(playModel.k),
    curvature: Number(playModel.curvature),
    relative,
    line: {
      color: String(playModel.lineColor),
      orbitColor: String(playModel.orbitColor),
      width: Number(playModel.lineWidth),
      duration: [Number(playModel.lineDurationMin), Number(playModel.lineDurationMax)],
      radius: Number(playModel.lineRadius),
    },
    halo: {
      show: Boolean(playModel.showHalo),
      duration: [Number(playModel.haloDurationMin), Number(playModel.haloDurationMax)],
      color: String(playModel.haloColor),
      radius: Number(playModel.haloRadius),
    },
    icon: {
      show: Boolean(playModel.showIcon),
      src: String(playModel.iconSrc),
      width: Number(playModel.iconWidth),
      height: Number(playModel.iconHeight),
    },
    text: {
      show: Boolean(playModel.showText),
      color: String(playModel.textColor),
      fontSize: Number(playModel.textFontSize),
      offset: [Number(playModel.textOffsetX), Number(playModel.textOffsetY)],
    },
  }
})

function compactConfig(value: FlylineEnhancedConfig): string {
  return JSON.stringify(value, null, 2)
    .replace(/\[\n\s+(-?\d+(?:\.\d+)?),\n\s+(-?\d+(?:\.\d+)?)\n\s+\]/g, '[$1, $2]')
    .replace(/\{\n\s+"name": "([^"]+)",\n\s+"coordinate": (\[[^\n]+\])\n\s+\}/g, '{ "name": "$1", "coordinate": $2 }')
    .replace(/\{\n\s+"source": "([^"]+)",\n\s+"target": "([^"]+)"\n\s+\}/g, '{ "source": "$1", "target": "$2" }')
}

function componentCode(value: FlylineEnhancedConfig, dev = false, ariaLabel = '增强飞线图'): string {
  return `<script setup lang="ts">
import { LumalFlylineChartEnhanced } from '@lumal/datav'

const config = ${compactConfig(value)}
<\/script>

<template>
  <LumalFlylineChartEnhanced
    :config="config"
    :dev="${dev}"
    aria-label="${ariaLabel}"
    style="width: 741px; height: 600px"
  />
<\/template>`
}

function playCodeGen(): string {
  return componentCode(playConfig.value, Boolean(playModel.dev), String(playModel.ariaLabel))
}

const code = componentCode(config)

const propRows: PropRow[] = [
  { name: 'config', type: 'FlylineEnhancedConfig', description: '增强飞线配置，支持任意起止点连线。' },
  { name: 'dev', type: 'boolean', default: 'false', description: '开发模式，点击图表可输出绝对坐标与相对坐标。' },
  { name: 'ariaLabel', type: 'string', default: "'增强飞线图'", description: '无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'points', type: 'FlylineEnhancedPoint[]', description: '命名坐标点：name + coordinate，可覆盖全局 halo/text/icon。' },
  { name: 'lines', type: 'FlylineEnhancedLine[]', description: '连线：source/target 指向 point 名称，并可覆盖全局 line。' },
  { name: 'line', type: 'FlylineLineStyle', description: '全局飞线样式：width、color、orbitColor、duration、radius。' },
  { name: 'halo', type: 'FlylineHaloStyle', description: '全局点光晕样式。' },
  { name: 'icon', type: 'FlylineIconStyle', description: '全局点图标样式。' },
  { name: 'text', type: 'FlylineTextStyle', description: '全局点文字样式。' },
  { name: 'bgImgSrc', type: 'string', description: 'DataV 原生背景图地址。' },
  { name: 'k', type: 'number', description: '飞线收束程度，范围 -1~1。' },
  { name: 'curvature', type: 'number', description: '连线曲率。' },
  { name: 'relative', type: 'boolean', description: '坐标是否按容器宽高使用相对值。' },
]
</script>

<template>
  <ComponentDoc
    title="FlylineChartEnhanced 飞线图增强版"
    component-name="LumalFlylineChartEnhanced"
    datav-name="flylineChartEnhanced"
    intro="配置命名点后可在任意两点之间设置飞线；本页主示例使用 DataV 官方河南地图与郑州汇聚拓扑。"
  >
    <Playground
      title="官方基本示例 · 全属性在线调试"
      description="所有 DataV 原生全局配置均可实时修改；点图标、点名称、光晕和背景图使用开关渐进显示相关配置。"
      component-name="LumalFlylineChartEnhanced"
      :controls="playControls"
      v-model="playModel"
      :columns="3"
      :min-height="656"
      :code-gen="playCodeGen"
    >
      <LumalFlylineChartEnhanced
        :config="playConfig"
        :dev="Boolean(playModel.dev)"
        :aria-label="String(playModel.ariaLabel)"
        class="flyline-official-demo"
      />
    </Playground>

    <DemoBlock
      title="基本示例"
      description="复刻 DataV 官方基本示例：18 个河南地市点中，17 条飞线分别从各地市汇聚到郑州。"
      :code="code"
      :min-height="656"
    >
      <LumalFlylineChartEnhanced :config="config" dev class="flyline-official-demo" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />

    <h2>config 字段</h2>
    <PropsTable :rows="configRows" name-label="字段" />
  </ComponentDoc>
</template>

<style scoped>
.flyline-official-demo {
  flex: 0 1 741px;
  width: min(100%, 741px);
  height: auto;
  aspect-ratio: 741 / 600;
  overflow: hidden;
  border-radius: 6px;
}

:deep(.playground__stage),
:deep(.demo-block__stage) {
  background: #282c34;
}
</style>
