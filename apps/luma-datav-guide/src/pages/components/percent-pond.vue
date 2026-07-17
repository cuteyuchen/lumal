<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaPercentPond } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

// 在线调试的属性模型与默认值
const playModel = reactive<Record<string, unknown>>({
  value: 72,
  shape: 'capsule',
  showLabel: true,
  borderWidth: 3,
  borderRadius: 5,
  textColor: '#ffffff',
})

// 在线调试的控件定义
const playControls: PlaygroundControl[] = [
  { key: 'value', label: '数值 value', type: 'number', min: 0, max: 100, step: 1 },
  { key: 'shape', label: '外形 shape', type: 'select', options: [{ label: 'bar', value: 'bar' }, { label: 'capsule', value: 'capsule' }] },
  { key: 'showLabel', label: '显示文本 showLabel', type: 'boolean' },
  { key: 'borderWidth', label: '边框宽 borderWidth', type: 'number', min: 0, max: 20, step: 1 },
  { key: 'borderRadius', label: '圆角 borderRadius', type: 'number', min: 0, max: 30, step: 1 },
  { key: 'textColor', label: '文本颜色 textColor', type: 'color' },
]

const modernCode = `<LumaPercentPond :value="72" shape="capsule" />
<LumaPercentPond :value="45" shape="bar" :colors="['#6ff7cd', '#35c8ff']" />`

const configCode = `<LumaPercentPond :config="{ value: 72, colors: ['#00c0ff', '#4dfffe'], formatter: '{value}%' }" />`

const propRows: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: '百分比数值（0–100）。' },
  { name: 'config', type: 'PercentPondConfig', default: 'undefined', description: 'DataV 原生配置对象。' },
  { name: 'shape', type: "'bar' | 'capsule'", default: "'bar'", description: '外形：条形或胶囊。' },
  { name: 'colors', type: 'string[]', default: '内置渐变', description: '填充渐变色。' },
  { name: 'formatter', type: '(value) => string', default: "'{value}%'", description: '文本格式化。' },
  { name: 'showLabel', type: 'boolean', default: 'true', description: '是否显示中间文本。' },
  { name: 'borderWidth', type: 'number', default: '按上游', description: '边框宽度。' },
  { name: 'borderGap', type: 'number', default: '按上游', description: '边框与填充间距。' },
  { name: 'borderRadius', type: 'number', default: '按上游', description: '圆角半径。' },
  { name: 'textColor', type: 'string', default: '按上游', description: '文本颜色。' },
  { name: 'localGradient', type: 'boolean', default: 'false', description: '渐变是否随填充长度局部计算。' },
]
</script>

<template>
  <ComponentDoc
    title="PercentPond 占比池"
    component-name="LumaPercentPond"
    datav-name="percentPond"
    intro="百分比进度池，支持条形与胶囊两种外形。适合展示单一指标的完成率或占比。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaPercentPond"
      :controls="playControls"
      :model-value="playModel"
      :min-height="160"
    >
      <LumaPercentPond
        :value="playModel.value as number"
        :shape="playModel.shape as 'bar' | 'capsule'"
        :show-label="playModel.showLabel as boolean"
        :border-width="playModel.borderWidth as number"
        :border-radius="playModel.borderRadius as number"
        :text-color="playModel.textColor as string"
        style="width: 320px; height: 60px;"
      />
    </Playground>

    <DemoBlock
      title="两种外形"
      description="shape 切换 bar / capsule。"
      :code="modernCode"
    >
      <div class="pond-stack">
        <LumaPercentPond :value="72" shape="capsule" style="width: 320px; height: 60px;" />
        <LumaPercentPond :value="45" shape="bar" :colors="['#6ff7cd', '#35c8ff']" style="width: 320px; height: 40px;" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="DataV 原生 config"
      description="colors 与 formatter 兼容上游写法。"
      :code="configCode"
    >
      <LumaPercentPond
        :config="{ value: 72, colors: ['#00c0ff', '#4dfffe'], formatter: '{value}%' }"
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
