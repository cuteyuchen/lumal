<script setup lang="ts">
import CodeBlock from '@/components/CodeBlock.vue'

const install = `pnpm add @luma/datav vue echarts`

const global = `import { createApp } from 'vue'
import LumaDatav from '@luma/datav'
import '@luma/datav/style.css'
import App from './App.vue'

createApp(App).use(LumaDatav).mount('#app')`

const named = `import { LumaBorderBox, LumaDigitalFlop } from '@luma/datav'
import '@luma/datav/style.css'`

const subpath = `import LumaBorderBox from '@luma/datav/border-box'
import LumaFlylineChart from '@luma/datav/flyline-chart'
import '@luma/datav/style.css'`
</script>

<template>
  <article class="guide-doc">
    <header class="guide-doc__head">
      <p class="guide-doc__eyebrow">指南</p>
      <h1>安装与注册</h1>
      <p class="guide-doc__lead">
        <code>@luma/datav</code> 把 <code>vue</code> 与 <code>echarts</code> 作为 peer dependency，
        由应用侧安装。仅使用非图表组件时也可以不安装 echarts。
      </p>
    </header>

    <section class="guide-doc__section">
      <h2>安装</h2>
      <CodeBlock :code="install" language="bash" />
    </section>

    <section class="guide-doc__section">
      <h2>全局注册</h2>
      <p>通过默认导出的插件一次性注册全部组件：</p>
      <CodeBlock :code="global" language="ts" />
    </section>

    <section class="guide-doc__section">
      <h2>按需导入</h2>
      <p>直接从根入口具名导入需要的组件，配合打包器 tree-shaking：</p>
      <CodeBlock :code="named" language="ts" />
      <p>也支持 15 个独立子入口，进一步减小首屏体积：</p>
      <CodeBlock :code="subpath" language="ts" />
      <p>
        15 个子入口分别为 <code>border-box</code>、<code>decoration</code>、<code>full-screen-container</code>、
        <code>loading</code>、<code>charts</code>、<code>active-ring-chart</code>、<code>capsule-chart</code>、
        <code>water-level-pond</code>、<code>percent-pond</code>、<code>digital-flop</code>、
        <code>flyline-chart</code>、<code>flyline-chart-enhanced</code>、<code>conical-column-chart</code>、
        <code>scroll-board</code> 与 <code>scroll-ranking-board</code>。
      </p>
    </section>

    <section class="guide-doc__section">
      <h2>样式入口</h2>
      <p>
        无论全局注册还是按需导入，都需要引入一次 <code>@luma/datav/style.css</code>。
        它包含组件默认几何与 <code>--luma-datav-*</code> 主题变量，见
        <RouterLink to="/theming">主题变量</RouterLink>。
      </p>
    </section>
  </article>
</template>
