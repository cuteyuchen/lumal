<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaDecoration } from '@luma/datav'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const variants = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const basicCode = `<div style="height: 60px">
  <LumaDecoration :variant="8" />
</div>`

const colorCode = `<LumaDecoration :variant="2" :colors="['#6ff7cd', '#796cff']" />`

const propRows: PropRow[] = [
  { name: 'variant', type: 'DecorationVariant (1–12)', default: '1', description: '装饰样式编号，对应 DataV decoration1–12。' },
  { name: 'colors', type: '[string, string]', default: '按 variant 内置', description: '现代 props：两段主色。' },
  { name: 'color', type: '[string, string]', default: '按 variant 内置', description: 'DataV 原生配色 prop。' },
  { name: 'background', type: 'string', default: 'undefined', description: '背景色（部分变体支持）。' },
  { name: 'duration', type: 'number', default: '按 variant', description: '主动画时长，毫秒。' },
  { name: 'dur', type: 'number', default: '按 variant', description: 'DataV 原生动画时长，单位秒。' },
  { name: 'scanDur', type: 'number', default: 'undefined', description: '扫描线动画时长（含扫描的变体）。' },
  { name: 'haloDur', type: 'number', default: 'undefined', description: '光晕动画时长（含光晕的变体）。' },
  { name: 'reverse', type: 'boolean', default: 'false', description: '反转动画方向。' },
]
</script>

<template>
  <ComponentDoc
    title="Decoration 装饰"
    component-name="LumaDecoration"
    datav-name="decoration1–12"
    intro="氛围装饰件，共 12 种变体。多用于面板标题旁、分隔线或角落点缀，自带循环动画。"
  >
    <DemoBlock
      title="全部 12 种变体"
      description="variant 1–12 的默认样式一览。"
      :code="basicCode"
      :min-height="420"
    >
      <div class="deco-grid">
        <div v-for="v in variants" :key="v" class="deco-grid__cell">
          <span class="deco-grid__label">variant {{ v }}</span>
          <div class="deco-grid__stage">
            <LumaDecoration :variant="v" />
          </div>
        </div>
      </div>
    </DemoBlock>

    <DemoBlock
      title="自定义配色"
      description="通过 colors 覆盖内置主色。"
      :code="colorCode"
    >
      <div style="width: 360px; height: 60px;">
        <LumaDecoration :variant="2" :colors="['#6ff7cd', '#796cff']" />
      </div>
    </DemoBlock>

    <h2>属性</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.deco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
  width: 100%;
}

.deco-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deco-grid__label {
  font-size: 12px;
  color: var(--guide-text-muted);
}

.deco-grid__stage {
  height: 56px;
}
</style>
