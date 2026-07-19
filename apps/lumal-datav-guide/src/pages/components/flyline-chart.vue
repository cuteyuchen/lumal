<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import type { FlylineChartConfig, FlylineCoordinate } from '@lumal/datav'
import { LumalFlylineChart } from '@lumal/datav'
import { computed, reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const chartWidth = 741
const chartHeight = 600
const mapUrl = '/img/flylineChart/map.jpg'
const centerIconUrl = '/img/flylineChart/mapCenterPoint.png'
const pointIconUrl = '/img/flylineChart/mapPoint.png'

const cityNames = [
  '新乡', '焦作', '开封', '许昌', '平顶山', '洛阳', '周口', '漯河', '南阳',
  '信阳', '驻马店', '济源', '三门峡', '商丘', '鹤壁', '濮阳', '安阳',
] as const

const cityPoints: readonly FlylineCoordinate[] = [
  [0.52, 0.23], [0.43, 0.29], [0.59, 0.35], [0.53, 0.47], [0.45, 0.54],
  [0.36, 0.38], [0.62, 0.55], [0.56, 0.56], [0.37, 0.66], [0.55, 0.81],
  [0.55, 0.67], [0.37, 0.29], [0.20, 0.36], [0.76, 0.41], [0.59, 0.18],
  [0.68, 0.17], [0.59, 0.10],
]

// DataV 官方文档「基本示例」。
const config: Partial<FlylineChartConfig> = {
  centerPoint: [0.48, 0.35],
  points: cityPoints,
  bgImgUrl: mapUrl,
}

const playModel = reactive<Record<string, unknown>>({
  ariaLabel: 'DataV 官方河南飞线图',
  dev: false,
  pointCount: cityPoints.length,
  centerX: 0.48,
  centerY: 0.35,
  relative: true,
  showBackground: true,
  bgImgUrl: mapUrl,
  flylineColor: '#ffde93',
  orbitColor: 'rgba(103, 224, 227, .2)',
  lineWidth: 1,
  k: -0.5,
  curvature: 5,
  flylineRadius: 100,
  durationMin: 20,
  durationMax: 30,
  showHalo: true,
  haloDuration: 30,
  haloColor: '#fb7293',
  haloRadius: 120,
  showCenterIcon: false,
  centerIconUrl,
  centerIconWidth: 40,
  centerIconHeight: 40,
  showPointIcon: false,
  pointIconUrl,
  pointIconWidth: 15,
  pointIconHeight: 15,
  showText: false,
  textColor: '#ffdb5c',
  textFontSize: 12,
  textOffsetX: 0,
  textOffsetY: 15,
})

const playControls: PlaygroundControl[] = [
  { key: 'ariaLabel', label: '无障碍标签 ariaLabel', type: 'text', omitFromCode: true },
  { key: 'dev', label: '开发坐标模式 dev', type: 'boolean', omitFromCode: true },
  { key: 'pointCount', label: '点数量 points', type: 'number', min: 1, max: cityPoints.length, step: 1, omitFromCode: true },
  { key: 'centerX', label: '中心点 X', type: 'number', min: 0, max: 1, step: 0.01, omitFromCode: true },
  { key: 'centerY', label: '中心点 Y', type: 'number', min: 0, max: 1, step: 0.01, omitFromCode: true },
  { key: 'relative', label: '相对坐标 relative', type: 'boolean', omitFromCode: true, hint: '关闭后自动换算为 741 × 600 示例的像素坐标。' },
  { key: 'showBackground', label: '显示背景图', type: 'boolean', omitFromCode: true },
  { key: 'bgImgUrl', label: '背景图 bgImgUrl', type: 'text', omitFromCode: true, hidden: model => !model.showBackground },
  { key: 'flylineColor', label: '飞线色 flylineColor', type: 'color', omitFromCode: true },
  { key: 'orbitColor', label: '轨道色 orbitColor', type: 'text', omitFromCode: true },
  { key: 'lineWidth', label: '线宽 lineWidth', type: 'number', min: 1, max: 8, step: 1, omitFromCode: true },
  { key: 'k', label: '收束程度 k', type: 'number', min: -1, max: 1, step: 0.1, omitFromCode: true },
  { key: 'curvature', label: '曲率 curvature', type: 'number', min: 1, max: 10, step: 1, omitFromCode: true },
  { key: 'flylineRadius', label: '显示半径 flylineRadius', type: 'number', min: 20, max: 240, step: 10, omitFromCode: true },
  { key: 'durationMin', label: '最短时长 duration[0]', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true },
  { key: 'durationMax', label: '最长时长 duration[1]', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true },
  { key: 'showHalo', label: '显示中心光晕 halo.show', type: 'boolean', omitFromCode: true },
  { key: 'haloDuration', label: '光晕时长 halo.duration', type: 'number', min: 1, max: 100, step: 1, omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'haloColor', label: '光晕色 halo.color', type: 'color', omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'haloRadius', label: '光晕半径 halo.radius', type: 'number', min: 10, max: 240, step: 10, omitFromCode: true, hidden: model => !model.showHalo },
  { key: 'showCenterIcon', label: '显示中心图标', type: 'boolean', omitFromCode: true },
  { key: 'centerIconUrl', label: '中心图标 URL', type: 'text', omitFromCode: true, hidden: model => !model.showCenterIcon },
  { key: 'centerIconWidth', label: '中心图标宽度', type: 'number', min: 8, max: 100, step: 1, omitFromCode: true, hidden: model => !model.showCenterIcon },
  { key: 'centerIconHeight', label: '中心图标高度', type: 'number', min: 8, max: 100, step: 1, omitFromCode: true, hidden: model => !model.showCenterIcon },
  { key: 'showPointIcon', label: '显示点图标', type: 'boolean', omitFromCode: true },
  { key: 'pointIconUrl', label: '点图标 URL', type: 'text', omitFromCode: true, hidden: model => !model.showPointIcon },
  { key: 'pointIconWidth', label: '点图标宽度', type: 'number', min: 4, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showPointIcon },
  { key: 'pointIconHeight', label: '点图标高度', type: 'number', min: 4, max: 60, step: 1, omitFromCode: true, hidden: model => !model.showPointIcon },
  { key: 'showText', label: '显示地市文本 text.show', type: 'boolean', omitFromCode: true },
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

const playConfig = computed<Partial<FlylineChartConfig>>(() => {
  const relative = Boolean(playModel.relative)
  const pointCount = Math.max(1, Math.min(cityPoints.length, Number(playModel.pointCount)))
  const showText = Boolean(playModel.showText)
  const points = cityPoints.slice(0, pointCount).map((position, index) => {
    const resolvedPosition = toCoordinate(position, relative)
    return showText ? { position: resolvedPosition, text: cityNames[index] } : resolvedPosition
  })

  return {
    centerPoint: toCoordinate([Number(playModel.centerX), Number(playModel.centerY)], relative),
    points,
    bgImgUrl: playModel.showBackground ? String(playModel.bgImgUrl) : '',
    centerPointImg: {
      url: playModel.showCenterIcon ? String(playModel.centerIconUrl) : '',
      width: Number(playModel.centerIconWidth),
      height: Number(playModel.centerIconHeight),
    },
    pointsImg: {
      url: playModel.showPointIcon ? String(playModel.pointIconUrl) : '',
      width: Number(playModel.pointIconWidth),
      height: Number(playModel.pointIconHeight),
    },
    flylineColor: String(playModel.flylineColor),
    orbitColor: String(playModel.orbitColor),
    lineWidth: Number(playModel.lineWidth),
    k: Number(playModel.k),
    curvature: Number(playModel.curvature),
    flylineRadius: Number(playModel.flylineRadius),
    duration: [Number(playModel.durationMin), Number(playModel.durationMax)],
    relative,
    halo: {
      show: Boolean(playModel.showHalo),
      duration: Number(playModel.haloDuration),
      color: String(playModel.haloColor),
      radius: Number(playModel.haloRadius),
    },
    text: {
      show: showText,
      color: String(playModel.textColor),
      fontSize: Number(playModel.textFontSize),
      offset: [Number(playModel.textOffsetX), Number(playModel.textOffsetY)],
    },
  }
})

function compactConfig(value: Partial<FlylineChartConfig>): string {
  return JSON.stringify(value, null, 2)
    .replace(/\[\n\s+(-?\d+(?:\.\d+)?),\n\s+(-?\d+(?:\.\d+)?)\n\s+\]/g, '[$1, $2]')
    .replace(/\{\n\s+"position": (\[[^\n]+\]),\n\s+"text": "([^"]*)"\n\s+\}/g, '{ "position": $1, "text": "$2" }')
}

function componentCode(value: Partial<FlylineChartConfig>, dev = false, ariaLabel = '飞线图'): string {
  return `<script setup lang="ts">
import { LumalFlylineChart } from '@lumal/datav'

const config = ${compactConfig(value)}
<\/script>

<template>
  <LumalFlylineChart
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
  { name: 'config', type: 'Partial<FlylineChartConfig>', description: '飞线配置，中心点向各点辐射飞线。' },
  { name: 'dev', type: 'boolean', default: 'false', description: '开发模式，配合 position 事件标定坐标。' },
  { name: 'ariaLabel', type: 'string', default: "'飞线图'", description: '无障碍标签。' },
]

const configRows: PropRow[] = [
  { name: 'centerPoint', type: '[number, number]', description: '中心点坐标；relative 为 true 时使用 0~1 相对坐标。' },
  { name: 'points', type: '(FlylineChartPoint | [number, number])[]', description: '飞线起始点，可直接传坐标或 position + text 对象。' },
  { name: 'bgImgUrl', type: 'string', description: 'DataV 原生背景图地址。' },
  { name: 'centerPointImg', type: 'FlylineImageStyle', description: '中心点图标地址及尺寸。' },
  { name: 'pointsImg', type: 'FlylineImageStyle', description: '飞线起始点图标地址及尺寸。' },
  { name: 'flylineColor', type: 'string', description: '飞线颜色。' },
  { name: 'orbitColor', type: 'string', description: '轨道颜色。' },
  { name: 'lineWidth', type: 'number', description: '飞线宽度。' },
  { name: 'k', type: 'number', description: '飞线收束程度，范围 -1~1。' },
  { name: 'curvature', type: 'number', description: '飞线曲率。' },
  { name: 'flylineRadius', type: 'number', description: '飞线动态显示区域半径。' },
  { name: 'duration', type: '[number, number]', description: '飞线时长区间，数值单位遵循 DataV：10 = 1 秒。' },
  { name: 'halo', type: 'FlylineChartHaloStyle', description: '中心点光晕样式。' },
  { name: 'text', type: 'FlylineTextStyle', description: '点文字样式。' },
  { name: 'relative', type: 'boolean', description: '坐标是否按容器宽高使用相对值。' },
]
</script>

<template>
  <ComponentDoc
    title="FlylineChart 飞线图"
    component-name="LumalFlylineChart"
    datav-name="flylineChart"
    intro="设置一个中心点和若干飞线起始点即可生成动态飞线图；本页主示例使用 DataV 官方河南地图数据。"
  >
    <Playground
      title="官方基本示例 · 全属性在线调试"
      description="所有 DataV 原生配置均可实时修改；图标、文本、光晕和背景图使用开关渐进显示相关配置。"
      component-name="LumalFlylineChart"
      :controls="playControls"
      v-model="playModel"
      :columns="3"
      :min-height="656"
      :code-gen="playCodeGen"
    >
      <LumalFlylineChart
        :config="playConfig"
        :dev="Boolean(playModel.dev)"
        :aria-label="String(playModel.ariaLabel)"
        class="flyline-official-demo"
      />
    </Playground>

    <DemoBlock
      title="基本示例"
      description="复刻 DataV 官方基本示例：河南地图以郑州为中心，17 条飞线从各地市汇聚到中心点。"
      :code="code"
      :min-height="656"
    >
      <LumalFlylineChart :config="config" dev class="flyline-official-demo" />
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
