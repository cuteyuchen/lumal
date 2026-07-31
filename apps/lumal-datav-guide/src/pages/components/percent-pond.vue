<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumalPercentPond } from '@lumal/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

// 在线调试的属性模型与默认值
const playModel = reactive<Record<string, unknown>>({
  value: 72,
  shape: 'bar',
  showLabel: true,
  borderWidth: 3,
  borderRadius: 5,
  borderGap: 3,
  textColor: '#ffffff',
  color1: '#00c0ff',
  color2: '#4dfffe',
  localGradient: false,
})

// 在线调试的控件定义
const playControls: PlaygroundControl[] = [
  { key: 'value', label: '数值 value', type: 'number', min: 0, max: 100, step: 1 },
  { key: 'shape', label: '外形 shape', type: 'select', options: [{ label: 'bar', value: 'bar' }, { label: 'capsule', value: 'capsule' }] },
  { key: 'showLabel', label: '显示文本 showLabel', type: 'boolean' },
  { key: 'borderWidth', label: '边框宽 borderWidth', type: 'number', min: 0, max: 20, step: 1 },
  { key: 'borderGap', label: '边框间距 borderGap', type: 'number', min: 0, max: 20, step: 1 },
  { key: 'borderRadius', label: '圆角 borderRadius', type: 'number', min: 0, max: 30, step: 1 },
  { key: 'textColor', label: '文本颜色 textColor', type: 'color' },
  { key: 'color1', label: '填充色 colors[0]', type: 'color', omitFromCode: true },
  { key: 'color2', label: '填充色 colors[1]', type: 'color', omitFromCode: true },
  { key: 'localGradient', label: '局部渐变 localGradient', type: 'boolean' },
]

const modernCode = `<LumalPercentPond :value="72" />
<!-- shape="capsule" 是 Lumal 扩展 -->
<LumalPercentPond :value="45" shape="capsule" :colors="['#6ff7cd', '#35c8ff']" />`

const configCode = `<LumalPercentPond :config="{ value: 72, borderRadius: 24, colors: ['#00c0ff', '#4dfffe'], formatter: '{value}%' }" />`

const propRows: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: '百分比数值（0–100）。' },
  { name: 'config', type: 'PercentPondConfig', default: 'undefined', description: 'DataV 原生配置对象。' },
  { name: 'shape', type: '\'bar\' | \'capsule\'', default: '\'bar\'', description: '外形：条形或胶囊。' },
  { name: 'colors', type: 'string[]', default: '内置渐变', description: '填充渐变色。' },
  { name: 'formatter', type: '(value) => string', default: '\'{value}%\'', description: '文本格式化。' },
  { name: 'showLabel', type: 'boolean', default: 'true', description: '是否显示中间文本。' },
  { name: 'borderWidth', type: 'number', default: '3', description: '边框宽度。' },
  { name: 'borderGap', type: 'number', default: '3', description: '边框与填充间距。' },
  { name: 'borderRadius', type: 'number', default: '5', description: '边框圆角；与上游一致，不额外裁剪内部进度线。' },
  { name: 'textColor', type: 'string', default: '\'#fff\'', description: '文本颜色。' },
  { name: 'localGradient', type: 'boolean', default: 'false', description: '渐变是否随填充长度局部计算。' },
]
</script>

<template>
  <ComponentDoc
    title="PercentPond 占比池"
    component-name="LumalPercentPond"
    datav-name="percentPond"
    intro="对齐 DataV 百分比池：圆角只作用于渐变边框，内部虚线进度保持原生 polyline 几何；另保留 capsule 外形扩展。"
  >
    <Playground
      v-model="playModel"
      title="在线调试"
      description="实时调整 borderRadius；较大圆角只改变边框，不会裁剪内部进度线。"
      component-name="LumalPercentPond"
      :controls="playControls"
      :min-height="160"
    >
      <LumalPercentPond
        :value="playModel.value as number"
        :shape="playModel.shape as 'bar' | 'capsule'"
        :show-label="playModel.showLabel as boolean"
        :border-width="playModel.borderWidth as number"
        :border-gap="playModel.borderGap as number"
        :border-radius="playModel.borderRadius as number"
        :text-color="playModel.textColor as string"
        :colors="[playModel.color1 as string, playModel.color2 as string]"
        :local-gradient="playModel.localGradient as boolean"
        style="width: 320px; height: 60px;"
      />
    </Playground>

    <DemoBlock
      title="原生条形与扩展胶囊"
      description="默认 bar 对齐 DataV；shape=&quot;capsule&quot; 为 Lumal 扩展。"
      :code="modernCode"
    >
      <div class="pond-stack">
        <LumalPercentPond :value="72" style="width: 320px; height: 60px;" />
        <LumalPercentPond :value="45" shape="capsule" :colors="['#6ff7cd', '#35c8ff']" style="width: 320px; height: 40px;" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="DataV 原生 config"
      description="大 borderRadius 用于验证上游只绘制圆角边框、不裁剪进度线的行为。"
      :code="configCode"
    >
      <LumalPercentPond
        :config="{ value: 72, borderRadius: 24, colors: ['#00c0ff', '#4dfffe'], formatter: '{value}%' }"
        style="width: 320px; height: 60px;"
      />
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.pond-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}
</style>
