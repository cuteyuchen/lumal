<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaDigitalFlop } from '@luma/datav'
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
  color: '#6ff7cd',
  fontSize: 40,
})

const playControls: PlaygroundControl[] = [
  { key: 'value', label: '数值 value', type: 'number', min: 0, max: 100000, step: 1 },
  { key: 'prefix', label: '前缀 prefix', type: 'text' },
  { key: 'suffix', label: '后缀 suffix', type: 'text' },
  { key: 'precision', label: '小数位 precision', type: 'number', min: 0, max: 4, step: 1 },
  { key: 'duration', label: '动画时长 duration', type: 'number', min: 0, max: 4000, step: 100, hint: '毫秒' },
  { key: 'color', label: '颜色 color', type: 'color' },
  { key: 'fontSize', label: '字号 fontSize', type: 'number', min: 12, max: 96, step: 2 },
]

const live = ref(1286)
const timer = window.setInterval(() => {
  live.value = 1000 + Math.floor(Math.random() * 800)
}, 2000)
onBeforeUnmount(() => window.clearInterval(timer))

const modernCode = `<LumaDigitalFlop :value="1286" suffix=" 台" :font-size="40" color="#6ff7cd" />
<LumaDigitalFlop :value="98.6" suffix="%" :precision="1" />`

const configCode = `<!-- DataV 原生 config：number 为数组，content 用 {nt} 占位 -->
<LumaDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" />`

const liveCode = `<script setup>
const live = ref(1286)
setInterval(() => { live.value = 1000 + Math.floor(Math.random() * 800) }, 2000)
<\/script>

<LumaDigitalFlop :value="live" :duration="900" />`

const propRows: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: '现代 props：目标数值，变化时滚动过渡。' },
  { name: 'numbers', type: 'number[]', default: 'undefined', description: '多段数字（对应 DataV number 数组）。' },
  { name: 'config', type: 'DigitalFlopConfig', default: 'undefined', description: 'DataV 原生配置对象。' },
  { name: 'content', type: 'string', default: 'undefined', description: '模板串，{nt} 为数字占位符。' },
  { name: 'prefix', type: 'string', default: "''", description: '数字前缀文本。' },
  { name: 'suffix', type: 'string', default: "''", description: '数字后缀文本。' },
  { name: 'precision', type: 'number', default: '0', description: '小数位数（等价 config.toFixed）。' },
  { name: 'duration', type: 'number', default: 'undefined', description: '滚动动画时长，毫秒。' },
  { name: 'formatter', type: '(value, index) => string', default: 'undefined', description: '自定义每段数字格式化。' },
  { name: 'color', type: 'string', default: "'#3de7c9'", description: '数字颜色。' },
  { name: 'fontSize', type: 'number', default: '30', description: '字号，像素。' },
  { name: 'fontWeight', type: 'number | string', default: "'normal'", description: '字重。' },
  { name: 'textAlign', type: "'left' | 'center' | 'right'", default: "'center'", description: '对齐方式。' },
]
</script>

<template>
  <ComponentDoc
    title="DigitalFlop 数字翻牌"
    component-name="LumaDigitalFlop"
    datav-name="digitalFlop"
    intro="数字滚动翻牌，数值变化时以动画过渡。支持前后缀、小数位、模板串与自定义格式化。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaDigitalFlop"
      :controls="playControls"
      :model-value="playModel"
      :min-height="180"
    >
      <LumaDigitalFlop
        :value="playModel.value as number"
        :prefix="playModel.prefix as string"
        :suffix="playModel.suffix as string"
        :precision="playModel.precision as number"
        :duration="playModel.duration as number"
        :color="playModel.color as string"
        :font-size="playModel.fontSize as number"
      />
    </Playground>

    <DemoBlock
      title="现代 props"
      description="value + suffix + precision 直接表达常见指标。"
      :code="modernCode"
    >
      <div class="flop-row">
        <LumaDigitalFlop :value="1286" suffix=" 台" :font-size="40" color="#6ff7cd" />
        <LumaDigitalFlop :value="98.6" suffix="%" :precision="1" :font-size="40" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="DataV 原生 config"
      description="number 数组与 {nt} 模板串保持上游语义。"
      :code="configCode"
    >
      <LumaDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" :font-size="40" />
    </DemoBlock>

    <DemoBlock
      title="实时数值"
      description="每 2 秒更新一次，观察滚动过渡。"
      :code="liveCode"
    >
      <LumaDigitalFlop :value="live" :duration="900" :font-size="46" color="#35c8ff" />
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
