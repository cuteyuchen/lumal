<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalDigitalFlop } from '@lumal/datav'
import { onBeforeUnmount, reactive, ref } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const playModel = reactive<Record<string, unknown>>({
  value: 1286,
  prefix: '',
  suffix: ' 台',
  precision: 0,
  duration: 1000,
  animationCurve: 'easeOutCubic',
  color: '#6ff7cd',
  fontSize: 40,
  fontWeight: 'normal',
  textAlign: 'center',
})

const playControls: PlaygroundControl[] = [
  { key: 'value', label: '数值 value', type: 'number', min: 0, max: 100000, step: 1 },
  { key: 'prefix', label: '前缀 prefix', type: 'text' },
  { key: 'suffix', label: '后缀 suffix', type: 'text' },
  { key: 'precision', label: '小数位 precision', type: 'number', min: 0, max: 4, step: 1 },
  { key: 'duration', label: '动画时长 duration', type: 'number', min: 0, max: 4000, step: 100, hint: '毫秒' },
  {
    key: 'animationCurve',
    label: '缓动 animationCurve',
    type: 'select',
    options: [
      { label: 'easeOutCubic', value: 'easeOutCubic' },
      { label: 'linear', value: 'linear' },
      { label: 'easeInQuad', value: 'easeInQuad' },
      { label: 'easeOutBounce', value: 'easeOutBounce' },
    ],
  },
  { key: 'color', label: '颜色 color', type: 'color' },
  { key: 'fontSize', label: '字号 fontSize', type: 'number', min: 12, max: 96, step: 2 },
  {
    key: 'fontWeight',
    label: '字重 fontWeight',
    type: 'select',
    options: [
      { label: 'normal', value: 'normal' },
      { label: 'bold', value: 'bold' },
      { label: '600', value: '600' },
    ],
  },
  {
    key: 'textAlign',
    label: '对齐 textAlign',
    type: 'select',
    options: [
      { label: 'left', value: 'left' },
      { label: 'center', value: 'center' },
      { label: 'right', value: 'right' },
    ],
  },
]

const live = ref(1286)
const timer = window.setInterval(() => {
  live.value = 1000 + Math.floor(Math.random() * 800)
}, 2000)
onBeforeUnmount(() => window.clearInterval(timer))

const modernCode = `<LumalDigitalFlop
  :value="1286"
  suffix=" 台"
  :font-size="40"
  color="#6ff7cd"
  style="width: 200px; height: 56px;"
/>
<LumalDigitalFlop
  :value="98.6"
  suffix="%"
  :precision="1"
  :font-size="40"
  style="width: 160px; height: 56px;"
/>`

const configCode = `<!-- DataV 原生 config：numberText 的 shape 与 style 均可配置 -->
<LumalDigitalFlop
  :config="{
    number: [1286],
    content: '{nt} 台',
    toFixed: 0,
    animationCurve: 'easeOutBounce',
    style: {
      fill: '#6ff7cd',
      stroke: '#123456',
      lineWidth: 1,
      lineDash: [3, 2],
      shadowBlur: 6,
      shadowColor: '#35c8ff',
    },
  }"
/>`

const liveCode = `<script setup>
const live = ref(1286)
setInterval(() => { live.value = 1000 + Math.floor(Math.random() * 800) }, 2000)
<\/script>

<LumalDigitalFlop :value="live" :duration="900" />`

const propRows: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: '现代 props：目标数值，变化时滚动过渡。' },
  { name: 'numbers', type: 'number[]', default: 'undefined', description: '多段数字（对应 DataV number 数组）。' },
  { name: 'config', type: 'DigitalFlopConfig', default: 'undefined', description: 'DataV 原生配置对象。' },
  { name: 'content', type: 'string', default: 'undefined', description: '模板串，{nt} 为数字占位符。' },
  { name: 'prefix', type: 'string', default: '\'\'', description: '数字前缀文本。' },
  { name: 'suffix', type: 'string', default: '\'\'', description: '数字后缀文本。' },
  { name: 'precision', type: 'number', default: '0', description: '小数位数（等价 config.toFixed）。' },
  { name: 'duration', type: 'number', default: 'undefined', description: '滚动动画时长，毫秒。' },
  { name: 'animationCurve', type: 'string', default: '\'easeOutCubic\'', description: 'DataV/CRender 缓动曲线名称。' },
  { name: 'animationFrame', type: 'number', default: '50', description: 'DataV config 动画帧数；未传 duration 时换算为时长。' },
  { name: 'formatter', type: '(value, index) => string', default: 'undefined', description: '自定义每段数字格式化。' },
  { name: 'color', type: 'string', default: '\'#3de7c9\'', description: '数字颜色。' },
  { name: 'fontSize', type: 'number', default: '30', description: '字号，像素。' },
  { name: 'fontWeight', type: 'number | string', default: '\'normal\'', description: '字重。' },
  { name: 'textAlign', type: '\'left\' | \'center\' | \'right\'', default: '\'center\'', description: '对齐方式。' },
]
</script>

<template>
  <ComponentDoc
    title="DigitalFlop 数字翻牌"
    component-name="LumalDigitalFlop"
    datav-name="digitalFlop"
    intro="对齐 DataV numberText：数值按 CRender 缓动曲线过渡，并映射填充、描边、虚线与阴影等原生 style。"
  >
    <Playground
      v-model="playModel"
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumalDigitalFlop"
      :controls="playControls"
      :min-height="180"
    >
      <LumalDigitalFlop
        :value="playModel.value as number"
        :prefix="playModel.prefix as string"
        :suffix="playModel.suffix as string"
        :precision="playModel.precision as number"
        :duration="playModel.duration as number"
        :animation-curve="playModel.animationCurve as string"
        :color="playModel.color as string"
        :font-size="playModel.fontSize as number"
        :font-weight="playModel.fontWeight as string"
        :text-align="playModel.textAlign as 'left' | 'center' | 'right'"
        style="width: 280px; height: 56px;"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="value + suffix + precision 直接表达常见指标。"
      :code="modernCode"
      :min-height="140"
    >
      <div class="flop-row">
        <LumalDigitalFlop
          :value="1286"
          suffix=" 台"
          :font-size="40"
          color="#6ff7cd"
          style="width: 200px; height: 56px;"
        />
        <LumalDigitalFlop
          :value="98.6"
          suffix="%"
          :precision="1"
          :font-size="40"
          style="width: 160px; height: 56px;"
        />
      </div>
    </DemoBlock>

    <DemoBlock
      title="DataV 原生 config"
      description="number、{nt} 模板、animationCurve 与 CRender style 保持上游语义。"
      :code="configCode"
      :min-height="140"
    >
      <LumalDigitalFlop
        :config="{
          number: [1286],
          content: '{nt} 台',
          toFixed: 0,
          animationFrame: 0,
          style: {
            fill: '#6ff7cd',
            fontSize: 40,
            stroke: '#123456',
            lineWidth: 1,
            lineDash: [3, 2],
            shadowBlur: 6,
            shadowColor: '#35c8ff',
          },
        }"
        style="width: 200px; height: 56px;"
      />
    </DemoBlock>

    <DemoBlock
      title="实时数值"
      description="每 2 秒更新一次，观察滚动过渡。"
      :code="liveCode"
      :min-height="140"
    >
      <LumalDigitalFlop
        :value="live"
        :duration="900"
        :font-size="46"
        color="#35c8ff"
        style="width: 220px; height: 60px;"
      />
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.flop-row {
  display: flex;
  gap: 48px;
  align-items: center;
}
</style>
