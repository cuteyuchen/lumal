<script setup lang="ts">
import CodeBlock from '@/components/CodeBlock.vue'
import PropsTable from '@/components/PropsTable.vue'

const variableRows = [
  { name: '--luma-datav-primary', type: 'color', default: '#35c8ff', description: '主强调色，用于飞线、图表主色等' },
  { name: '--luma-datav-secondary', type: 'color', default: '#796cff', description: '次强调色' },
  { name: '--luma-datav-accent', type: 'color', default: '#6ff7cd', description: '点缀色，用于高亮数值与描边' },
  { name: '--luma-datav-background', type: 'color', default: 'rgb(7 20 39 / 72%)', description: '组件最外层背景' },
  { name: '--luma-datav-surface', type: 'color', default: 'rgb(16 39 66 / 76%)', description: '卡片/面板表面色' },
  { name: '--luma-datav-surface-muted', type: 'color', default: 'rgb(24 56 90 / 56%)', description: '次级表面色，用于表头、斑马纹' },
  { name: '--luma-datav-text', type: 'color', default: '#edf9ff', description: '主文本色' },
  { name: '--luma-datav-text-muted', type: 'color', default: '#9fc4d7', description: '次要文本色' },
  { name: '--luma-datav-border', type: 'color', default: 'rgb(95 206 255 / 42%)', description: '描边与分隔线' },
  { name: '--luma-datav-shadow', type: 'shadow', default: '0 12px 32px rgb(0 8 24 / 30%)', description: '容器投影' },
  { name: '--luma-datav-radius', type: 'length', default: '10px', description: '统一圆角' },
  { name: '--luma-datav-duration', type: 'time', default: '2800ms', description: '连续动画默认时长' },
  { name: '--luma-datav-focus-ring', type: 'shadow', default: '—', description: '键盘聚焦轮廓' },
  { name: '--luma-datav-font-mono', type: 'font', default: 'Consolas, monospace', description: '等宽字体族' },
]

const overrideExample = `:root {
  /* 覆盖为品牌色，所有组件的现代 API 外观随之更新 */
  --luma-datav-primary: #1677ff;
  --luma-datav-accent: #36cfc9;
  --luma-datav-surface: rgb(20 30 48 / 80%);
  --luma-datav-radius: 6px;
}`

const scopeExample = `<!-- 变量可作用于任意子树，实现局部主题 -->
<section class="brand-panel">
  <LumaDigitalFlop :value="1286" suffix=" 台" />
</section>

<style>
.brand-panel {
  --luma-datav-primary: #f5a623;
  --luma-datav-accent: #ffd666;
}
</style>`

const cockpitExample = `/* Cockpit / Admin 应用层：把 datav 语义变量映射到自身主题令牌 */
:root {
  --luma-datav-primary: var(--luma-cockpit-accent);
  --luma-datav-surface: var(--luma-cockpit-surface);
  --luma-datav-text: var(--luma-cockpit-text);
}

/* 深色主题下切换令牌即可，datav 变量无需重复声明 */
[data-theme='dark'] {
  --luma-cockpit-accent: #35c8ff;
  --luma-cockpit-surface: rgb(16 39 66 / 76%);
}`
</script>

<template>
  <article class="guide-doc">
    <header class="guide-doc__head">
      <p class="guide-doc__eyebrow">指南</p>
      <h1>主题变量</h1>
      <p class="guide-doc__lead">
        组件默认值与 DataV 一致。现代 API 的外观由一组 <code>--luma-datav-*</code> 语义变量驱动，
        应用只需覆盖变量即可整体换肤，无需修改组件 props。
      </p>
    </header>

    <section class="guide-doc__section">
      <h2>变量清单</h2>
      <PropsTable
        :rows="variableRows"
        name-header="变量"
        :columns="['type', 'default', 'description']"
      />
    </section>

    <section class="guide-doc__section">
      <h2>全局覆盖</h2>
      <p>在应用入口样式的 <code>:root</code> 上重新声明变量即可全局生效。</p>
      <CodeBlock :code="overrideExample" language="css" />
    </section>

    <section class="guide-doc__section">
      <h2>局部主题</h2>
      <p>变量遵循 CSS 继承，可作用于任意容器子树，实现单个面板的独立配色。</p>
      <CodeBlock :code="scopeExample" language="html" />
    </section>

    <section class="guide-doc__section">
      <h2>与应用主题联动</h2>
      <p>
        推荐在应用层把 datav 变量映射到应用自身的主题令牌（如 <code>--luma-cockpit-*</code>），
        这样深浅色切换只需切换应用令牌，datav 组件自动跟随。
      </p>
      <CodeBlock :code="cockpitExample" language="css" />
    </section>
  </article>
</template>
