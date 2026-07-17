<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaLoading } from '@luma/datav'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const basicCode = `<LumaLoading label="加载中..." />`

const sizeCode = `<LumaLoading :size="80" label="正在拉取数据" />`

const colorCode = `<LumaLoading :colors="['#796cff', '#35c8ff']" label="加载中" />`

const propRows: PropRow[] = [
  { name: 'size', type: 'number | string', default: '50', description: '动画尺寸（像素或 CSS 长度）。' },
  { name: 'label', type: 'string', description: '动画下方的文案。' },
  { name: 'status', type: 'LoadingStatus', description: '加载状态，可用于切换动画表现。' },
  { name: 'variant', type: 'LoadingVariant', description: '动画变体。' },
  { name: 'colors', type: '[string, string]', default: "['#02bcfe', '#3be6cb']", description: '渐变起止色。' },
  { name: 'duration', type: 'number', description: '一个动画循环的时长（毫秒）。' },
]
</script>

<template>
  <ComponentDoc
    title="Loading 加载"
    component-name="LumaLoading"
    datav-name="loading"
    intro="驾驶舱加载动画，支持尺寸、渐变色与文案。动画在页面隐藏、离开视口或 prefers-reduced-motion 下自动暂停。"
  >
    <DemoBlock title="基础用法" description="默认渐变色加载动画。" :code="basicCode" :min-height="180">
      <LumaLoading label="加载中..." />
    </DemoBlock>

    <DemoBlock title="自定义尺寸" description="通过 size 调整动画大小。" :code="sizeCode" :min-height="200">
      <LumaLoading :size="80" label="正在拉取数据" />
    </DemoBlock>

    <DemoBlock title="自定义渐变色" description="colors 指定渐变起止色，对齐驾驶舱主题。" :code="colorCode" :min-height="180">
      <LumaLoading :colors="['#796cff', '#35c8ff']" label="加载中" />
    </DemoBlock>

    <h2>Props</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>
