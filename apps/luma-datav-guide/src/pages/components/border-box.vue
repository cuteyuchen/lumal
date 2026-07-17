<script setup lang="ts">
import type { BorderBoxVariant } from '@luma/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaBorderBox, LumaDigitalFlop } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

const variants = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const

const playModel = reactive<Record<string, unknown>>({
  variant: 8,
  title: '区域负载',
  titleWidth: 200,
  duration: 3000,
  reverse: false,
  backgroundColor: 'rgb(8 22 44 / 60%)',
})

const playControls: PlaygroundControl[] = [
  { key: 'variant', label: '变体 variant', type: 'select', options: variants.map(v => ({ label: `variant ${v}`, value: v })) },
  { key: 'title', label: '标题 title', type: 'text', hint: 'variant 11 支持' },
  { key: 'titleWidth', label: '标题宽 titleWidth', type: 'number', min: 80, max: 400, step: 10 },
  { key: 'duration', label: '动画时长 duration', type: 'number', min: 0, max: 8000, step: 200, hint: '毫秒，动效边框生效' },
  { key: 'reverse', label: '反转 reverse', type: 'boolean' },
  { key: 'backgroundColor', label: '内容背景 backgroundColor', type: 'text' },
]

const basicCode = `<LumaBorderBox :variant="8" :duration="3000">
  <div class="panel-body">驾驶舱面板内容</div>
</LumaBorderBox>`

const colorCode = `<!-- 现代 props：colors 为两段渐变色 -->
<LumaBorderBox :variant="1" :colors="['#6ff7cd', '#235fa7']">
  <LumaDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
</LumaBorderBox>

<!-- DataV 原生 props：color 数组同样兼容 -->
<LumaBorderBox :variant="1" :color="['#6ff7cd', '#235fa7']" background-color="rgb(8 22 44 / 60%)">
  <LumaDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
</LumaBorderBox>`

const titleCode = `<LumaBorderBox :variant="11" title="区域负载" :title-width="200">
  <div class="panel-body">带标题的边框（variant 11 支持标题）</div>
</LumaBorderBox>`

const propRows: PropRow[] = [
  { name: 'variant', type: 'BorderBoxVariant (1–13)', default: '1', description: '边框样式编号，对应 DataV borderBox1–13。' },
  { name: 'colors', type: '[string, string]', default: '按 variant 内置', description: '现代 props：两段渐变边框色。' },
  { name: 'color', type: 'string[]', default: '按 variant 内置', description: 'DataV 原生 props：边框色数组，等价 colors。' },
  { name: 'background', type: 'string', default: "'transparent'", description: '内容区背景色（现代 props）。' },
  { name: 'backgroundColor', type: 'string', default: "'transparent'", description: 'DataV 原生背景色 prop。' },
  { name: 'duration', type: 'number', default: '按 variant', description: '动效边框（如 variant 8）的动画时长，毫秒。' },
  { name: 'dur', type: 'number', default: '按 variant', description: 'DataV 原生动画时长，单位秒。' },
  { name: 'reverse', type: 'boolean', default: 'false', description: '反转动画方向。' },
  { name: 'title', type: 'string', default: "''", description: '标题文本（variant 11 支持）。' },
  { name: 'titleWidth', type: 'number', default: '250', description: '标题栏宽度，像素（variant 11）。' },
]
</script>

<template>
  <ComponentDoc
    title="BorderBox 边框"
    component-name="LumaBorderBox"
    datav-name="borderBox1–13"
    intro="科技感边框容器，共 13 种变体。作为面板外壳包裹任意内容，部分变体带描边流光动画。"
  >
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaBorderBox"
      :controls="playControls"
      :model-value="playModel"
      :min-height="220"
      slot-code="<LumaDigitalFlop :value=&quot;1286&quot; suffix=&quot; 台&quot; :font-size=&quot;34&quot; />"
    >
      <LumaBorderBox
        :variant="playModel.variant as BorderBoxVariant"
        :title="playModel.title as string"
        :title-width="playModel.titleWidth as number"
        :duration="playModel.duration as number"
        :reverse="playModel.reverse as boolean"
        :background-color="playModel.backgroundColor as string"
        style="width: 380px; height: 180px;"
      >
        <div class="panel-body">
          <LumaDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
        </div>
      </LumaBorderBox>
    </Playground>

    <DemoBlock
      title="全部 13 种变体"
      description="variant 1–13 的默认样式一览。"
      :code="basicCode"
      :min-height="360"
    >
      <div class="variant-grid">
        <div v-for="v in variants" :key="v" class="variant-grid__cell">
          <LumaBorderBox :variant="v">
            <div class="panel-body">
              variant {{ v }}
            </div>
          </LumaBorderBox>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="自定义配色"
      description="现代 colors 与 DataV color 数组都可覆盖内置配色。"
      :code="colorCode"
    >
      <LumaBorderBox :variant="1" :colors="['#6ff7cd', '#235fa7']" style="width: 320px; height: 160px;">
        <div class="panel-body">
          <LumaDigitalFlop :value="1286" suffix=" 台" :font-size="34" />
        </div>
      </LumaBorderBox>
    </DemoBlock>

    <DemoBlock
      title="带标题边框"
      description="variant 11 支持 title / titleWidth，标题居中显示在顶部缺口。"
      :code="titleCode"
    >
      <LumaBorderBox :variant="11" title="区域负载" :title-width="200" style="width: 360px; height: 170px;">
        <div class="panel-body">
          带标题的边框
        </div>
      </LumaBorderBox>
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
}

.variant-grid__cell {
  height: 180px;
}

.panel-body {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 12px;
  font-size: 13px;
  color: var(--luma-datav-text, #edf9ff);
}
</style>
