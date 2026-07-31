<script setup lang="ts">
import type { FullScreenContainerMode } from '@lumal/datav'
import type { PlaygroundControl } from '@/components/Playground.vue'
import type { PropRow } from '@/components/PropsTable.vue'
import { computed, reactive } from 'vue'
import CodeBlock from '@/components/CodeBlock.vue'
import ComponentDoc from '@/components/ComponentDoc.vue'
import Playground from '@/components/Playground.vue'
import PropsTable from '@/components/PropsTable.vue'

/**
 * 全屏容器真实组件 position:fixed 铺满视口，不适合文档内嵌。
 * 此处用同等缩放公式做迷你预览：在固定画布内模拟容器缩放效果。
 */
const playModel = reactive<Record<string, unknown>>({
  width: 1920,
  height: 1080,
  mode: 'scale',
  zIndex: 999,
  mockViewportW: 480,
  mockViewportH: 270,
})

const playControls: PlaygroundControl[] = [
  { key: 'width', label: '设计宽 width', type: 'number', min: 800, max: 3840, step: 40 },
  { key: 'height', label: '设计高 height', type: 'number', min: 600, max: 2160, step: 40 },
  {
    key: 'mode',
    label: '适配 mode',
    type: 'select',
    options: [
      { label: 'width 宽度等比', value: 'width' },
      { label: 'scale 等比居中', value: 'scale' },
      { label: 'vwvh 拉伸铺满', value: 'vwvh' },
    ],
  },
  { key: 'zIndex', label: '层级 zIndex', type: 'number', min: 1, max: 9999, step: 1 },
  { key: 'mockViewportW', label: '模拟视口宽', type: 'number', min: 200, max: 800, step: 10, omitFromCode: true },
  { key: 'mockViewportH', label: '模拟视口高', type: 'number', min: 120, max: 600, step: 10, omitFromCode: true },
]

const mockStageStyle = computed(() => {
  const designW = Math.max(1, playModel.width as number)
  const designH = Math.max(1, playModel.height as number)
  const viewW = Math.max(1, playModel.mockViewportW as number)
  const viewH = Math.max(1, playModel.mockViewportH as number)
  const mode = playModel.mode as FullScreenContainerMode

  if (mode === 'vwvh') {
    return {
      width: '100%',
      height: '100%',
      transform: 'none',
    }
  }

  if (mode === 'scale') {
    const scale = Math.min(viewW / designW, viewH / designH)
    const offsetX = (viewW - designW * scale) / 2
    const offsetY = (viewH - designH * scale) / 2
    return {
      width: `${designW}px`,
      height: `${designH}px`,
      transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
      transformOrigin: 'top left',
    }
  }

  // width：按宽度等比
  const widthScale = viewW / designW
  return {
    width: `${designW}px`,
    height: `${designH}px`,
    transform: `scale(${widthScale})`,
    transformOrigin: 'left top',
  }
})

const mockViewportStyle = computed(() => ({
  width: `${playModel.mockViewportW as number}px`,
  height: `${playModel.mockViewportH as number}px`,
}))

function playCodeGen(model: Record<string, unknown>): string {
  return `<LumalFullScreenContainer
  :width="${model.width}"
  :height="${model.height}"
  mode="${model.mode}"
  :z-index="${model.zIndex}"
>
  <YourCockpit />
</LumalFullScreenContainer>`
}

const usageCode = `<script setup lang="ts">
import { LumalFullScreenContainer } from '@lumal/datav'
<\/script>

<template>
  <LumalFullScreenContainer>
    <!-- 按 1920x1080 设计，运行时等比缩放铺满屏幕 -->
    <YourCockpit />
  </LumalFullScreenContainer>
<\/template>`

const sizeCode = `<LumalFullScreenContainer :width="2560" :height="1440">
  <YourCockpit />
</LumalFullScreenContainer>`

const modeCode = `<!-- width：按宽度等比缩放（默认，DataV 原生行为） -->
<LumalFullScreenContainer mode="width"><YourCockpit /></LumalFullScreenContainer>

<!-- scale：按宽高等比缩放并居中，四周留边，内容完整可见 -->
<LumalFullScreenContainer mode="scale"><YourCockpit /></LumalFullScreenContainer>

<!-- vwvh：拉伸铺满视口，子元素用设计像素单位布局 -->
<LumalFullScreenContainer mode="vwvh"><YourCockpit /></LumalFullScreenContainer>`

const unitCode = `<!-- vwvh 模式下，容器在 stage 上暴露两个自定义属性：
     --lumal-fsc-x-unit / --lumal-fsc-y-unit
     即“1 个设计像素”对应的 vw / vh，子元素可据此按设计稿尺寸布局 -->
<LumalFullScreenContainer mode="vwvh" :width="1920" :height="1080">
  <div :style="{
    width: 'calc(400 * var(--lumal-fsc-x-unit))',
    height: 'calc(200 * var(--lumal-fsc-y-unit))',
  }">
    面板
  </div>
</LumalFullScreenContainer>`

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
    component-name="LumalFullScreenContainer"
    datav-name="fullScreenContainer"
    intro="按设计稿尺寸等比缩放铺满屏幕的驾驶舱根容器。内部内容按固定设计尺寸布局，容器负责随视口缩放。"
  >
    <Playground
      v-model="playModel"
      title="在线调试（迷你预览）"
      description="真实组件会 fixed 铺满浏览器视口。下方用同等缩放公式在固定画布内模拟，可调 mode / 设计尺寸 / 模拟视口。"
      component-name="LumalFullScreenContainer"
      :controls="playControls"
      :min-height="320"
      :code-gen="playCodeGen"
      slot-code="<YourCockpit />"
    >
      <div class="fsc-mock" :style="mockViewportStyle">
        <div class="fsc-mock__stage" :style="mockStageStyle">
          <div class="fsc-mock__panel">
            <strong>{{ playModel.width }}×{{ playModel.height }}</strong>
            <span>mode={{ playModel.mode }}</span>
            <span>模拟视口 {{ playModel.mockViewportW }}×{{ playModel.mockViewportH }}</span>
          </div>
        </div>
      </div>
    </Playground>

    <h2>基础用法</h2>
    <p>
      把驾驶舱内容放进容器，按固定设计尺寸（默认 1920×1080）布局即可。
      容器会监听视口变化并等比缩放，无需为每种分辨率单独适配。
    </p>
    <CodeBlock :code="usageCode" language="vue" />

    <div class="callout callout--warn">
      该组件依赖真实视口尺寸进行缩放，适合作为整页驾驶舱的根容器。
      文档内「在线调试」仅为缩放公式的迷你模拟，不挂载真实 LumalFullScreenContainer。
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
      <code>vwvh</code> 模式下，容器在内部 stage 上暴露 <code>--lumal-fsc-x-unit</code> /
      <code>--lumal-fsc-y-unit</code>，表示“1 个设计像素”对应的 <code>vw</code> / <code>vh</code>。
      子元素用 <code>calc()</code> 乘以设计像素值即可随视口等比伸缩。
    </p>
    <CodeBlock :code="unitCode" language="vue" />

    <h2>Props</h2>
    <PropsTable :rows="propRows" />
  </ComponentDoc>
</template>

<style scoped>
.fsc-mock {
  position: relative;
  overflow: hidden;
  border: 1px dashed rgb(95 206 255 / 45%);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgb(95 206 255 / 8%) 1px, transparent 1px) 0 0 / 40px 40px,
    linear-gradient(rgb(95 206 255 / 8%) 1px, transparent 1px) 0 0 / 40px 40px,
    #06101f;
}

.fsc-mock__stage {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(120% 120% at 50% 0%, #0b1f3a 0%, #050d1c 70%);
  border: 1px solid rgb(53 200 255 / 35%);
  will-change: transform;
}

.fsc-mock__panel {
  display: grid;
  gap: 6px;
  place-items: center;
  min-width: 240px;
  padding: 20px 28px;
  border: 1px solid rgb(111 247 205 / 35%);
  border-radius: 10px;
  color: #cfeeff;
  background: rgb(8 22 44 / 70%);
  font-size: 13px;
}

.fsc-mock__panel strong {
  font-size: 18px;
  color: #6ff7cd;
}

.callout {
  margin: 12px 0 20px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.55;
}

.callout--warn {
  border: 1px solid rgb(250 173 20 / 40%);
  background: rgb(250 173 20 / 10%);
  color: var(--el-text-color-regular);
}
</style>
