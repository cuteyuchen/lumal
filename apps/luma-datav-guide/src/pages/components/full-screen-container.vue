<script setup lang="ts">
import type { PropRow } from '@/components/PropsTable.vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const usageCode = `<script setup lang="ts">
import { LumaFullScreenContainer } from '@luma/datav'
<\/script>

<template>
  <LumaFullScreenContainer>
    <!-- 按 1920x1080 设计，运行时等比缩放铺满屏幕 -->
    <YourCockpit />
  </LumaFullScreenContainer>
<\/template>`

const sizeCode = `<LumaFullScreenContainer :width="2560" :height="1440">
  <YourCockpit />
</LumaFullScreenContainer>`

const modeCode = `<!-- width：按宽度等比缩放（默认，DataV 原生行为） -->
<LumaFullScreenContainer mode="width"><YourCockpit /></LumaFullScreenContainer>

<!-- scale：按宽高等比缩放并居中，四周留边，内容完整可见 -->
<LumaFullScreenContainer mode="scale"><YourCockpit /></LumaFullScreenContainer>

<!-- vwvh：拉伸铺满视口，子元素用设计像素单位布局 -->
<LumaFullScreenContainer mode="vwvh"><YourCockpit /></LumaFullScreenContainer>`

const unitCode = `<!-- vwvh 模式下，容器在 stage 上暴露两个自定义属性：
     --luma-fsc-x-unit / --luma-fsc-y-unit
     即“1 个设计像素”对应的 vw / vh，子元素可据此按设计稿尺寸布局 -->
<LumaFullScreenContainer mode="vwvh" :width="1920" :height="1080">
  <div :style="{
    width: 'calc(400 * var(--luma-fsc-x-unit))',
    height: 'calc(200 * var(--luma-fsc-y-unit))',
  }">
    面板
  </div>
</LumaFullScreenContainer>`

const propRows: PropRow[] = [
  { name: 'width', type: 'number', default: '1920', description: '设计稿宽度，缩放基准。' },
  { name: 'height', type: 'number', default: '1080', description: '设计稿高度，缩放基准。' },
  { name: 'mode', type: `'width' | 'scale' | 'vwvh'`, default: `'width'`, description: '适配类别：width 按宽度等比缩放；scale 按宽高等比缩放并居中；vwvh 拉伸铺满并暴露设计像素单位。' },
  { name: 'zIndex', type: 'number', default: '999', description: '容器层级。' },
]
</script>

<template>
  <ComponentDoc
    title="FullScreenContainer 全屏容器"
    component-name="LumaFullScreenContainer"
    datav-name="fullScreenContainer"
    intro="按设计稿尺寸等比缩放铺满屏幕的驾驶舱根容器。内部内容按固定设计尺寸布局，容器负责随视口缩放。"
  >
    <h2>基础用法</h2>
    <p>
      把驾驶舱内容放进容器，按固定设计尺寸（默认 1920×1080）布局即可。
      容器会监听视口变化并等比缩放，无需为每种分辨率单独适配。
    </p>
    <CodeBlock :code="usageCode" language="vue" />

    <div class="callout callout--warn">
      该组件依赖真实视口尺寸进行缩放，适合作为整页驾驶舱的根容器，
      不适合嵌在本指南这类文档流的小卡片里预览，因此此处仅展示用法代码。
    </div>

    <h2>自定义设计尺寸</h2>
    <p>设计稿不是 1920×1080 时，通过 <code>width</code> / <code>height</code> 指定基准：</p>
    <CodeBlock :code="sizeCode" language="vue" />

    <h2>适配类别</h2>
    <p>
      通过 <code>mode</code> 选择适配方式。三种类别均由容器监听视口并实时计算：
    </p>
    <ul>
      <li><code>width</code>（默认）：按设计稿宽度等比缩放，还原 DataV 原生行为，高度可能溢出或留白。</li>
      <li><code>scale</code>：取宽、高缩放比的较小值等比缩放并居中，内容完整可见，四周按比例留边。</li>
      <li><code>vwvh</code>：用 <code>100vw</code> / <code>100vh</code> 拉伸铺满，可能改变宽高比，适合每个元素都按设计像素独立布局的场景。</li>
    </ul>
    <CodeBlock :code="modeCode" language="vue" />

    <h2>vwvh 设计像素单位</h2>
    <p>
      <code>vwvh</code> 模式下，容器在内部 stage 上暴露 <code>--luma-fsc-x-unit</code> /
      <code>--luma-fsc-y-unit</code>，表示“1 个设计像素”对应的 <code>vw</code> / <code>vh</code>。
      子元素用 <code>calc()</code> 乘以设计像素值即可随视口等比伸缩。
    </p>
    <CodeBlock :code="unitCode" language="vue" />

    <h2>Props</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>
