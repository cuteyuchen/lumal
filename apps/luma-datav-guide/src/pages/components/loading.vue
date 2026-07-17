<script setup lang="ts">
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { LumaLoading } from '@luma/datav'
import { reactive } from 'vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import DemoBlock from '@/components/DemoBlock.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

// 在线调试可调属性（colors 为数组，保持内置，仅暴露标量属性）
const playModel = reactive<Record<string, unknown>>({
  label: '加载中...',
  size: 50,
  variant: 'ring',
  status: 'loading',
  duration: 1500,
})

const playControls: PlaygroundControl[] = [
  { key: 'label', label: '文案 label', type: 'text' },
  { key: 'size', label: '尺寸 size', type: 'number', min: 20, max: 160, step: 2 },
  {
    key: 'variant',
    label: '变体 variant',
    type: 'select',
    options: [
      { label: '圆环 ring', value: 'ring' },
      { label: '圆点 dots', value: 'dots' },
      { label: '脉冲 pulse', value: 'pulse' },
    ],
  },
  {
    key: 'status',
    label: '状态 status',
    type: 'select',
    options: [
      { label: '加载中 loading', value: 'loading' },
      { label: '成功 success', value: 'success' },
      { label: '失败 error', value: 'error' },
    ],
  },
  { key: 'duration', label: '时长 duration', type: 'number', min: 500, max: 4000, step: 100, hint: '毫秒' },
]

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
    <Playground
      title="在线调试"
      description="实时修改属性，预览效果与代码同步更新。"
      component-name="LumaLoading"
      :controls="playControls"
      :model-value="playModel"
      :min-height="200"
    >
      <LumaLoading
        :label="playModel.label as string"
        :size="playModel.size as number"
        :variant="playModel.variant as 'ring' | 'dots' | 'pulse'"
        :status="playModel.status as 'loading' | 'success' | 'error'"
        :duration="playModel.duration as number"
      />
    </Playground>

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
