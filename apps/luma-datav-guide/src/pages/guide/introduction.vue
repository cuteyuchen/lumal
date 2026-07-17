<script setup lang="ts">
import CodeBlock from '@/components/CodeBlock.vue'

const configExample = `<LumaDigitalFlop :config="{ number: [1286], content: '{nt} 台', toFixed: 0 }" />
<LumaScrollBoard :config="{ header: ['区域', '数量'], data: [['甲区', 20]], rowNum: 5 }" />`

const modernExample = `<LumaBorderBox :variant="8" :duration="3000">
  <LumaDigitalFlop :value="1286" suffix=" 台" />
</LumaBorderBox>`
</script>

<template>
  <article class="guide-doc">
    <header class="guide-doc__head">
      <p class="guide-doc__eyebrow">指南</p>
      <h1>@luma/datav 介绍</h1>
      <p class="guide-doc__lead">
        面向 Luma 驾驶舱的 Vue 3 DataV 组件包。以 DataV 2.10.0（MIT）为基准，
        完整重构其 38 个组件的默认几何、动效与 <code>config</code> 协议，
        同时提供类型更明确的现代 props API。
      </p>
    </header>

    <section class="guide-doc__section">
      <h2>两套 API</h2>
      <p>
        DataV 原生配置可以直接迁移，无需改写字段：
      </p>
      <CodeBlock :code="configExample" language="vue" />
      <p>也可以使用类型更明确的现代 props：</p>
      <CodeBlock :code="modernExample" language="vue" />
      <p>
        同一字段同时出现时，优先级为：<strong>显式现代 props &gt; DataV <code>config</code> &gt; DataV 上游默认值</strong>。
        为避免注入风险，滚动表中的 HTML 字符串按普通文本渲染，不恢复上游 <code>v-html</code>；
        除此之外保留上游公开的视觉、几何、动画与事件语义。
      </p>
    </section>

    <section class="guide-doc__section">
      <h2>组件总览</h2>
      <p>本指南覆盖以下 15 个组件入口（对应 DataV 2.10.0 的 38 个组件）：</p>
      <ul class="guide-list">
        <li><strong>边框 / 装饰</strong>：BorderBox（13 变体）、Decoration（12 变体）。</li>
        <li><strong>数字与占比</strong>：DigitalFlop、PercentPond、WaterLevelPond。</li>
        <li><strong>图表</strong>：Charts（原生 ECharts）、ActiveRingChart、CapsuleChart、ConicalColumnChart。</li>
        <li><strong>飞线</strong>：FlylineChart、FlylineChartEnhanced。</li>
        <li><strong>轮播表</strong>：ScrollBoard、ScrollRankingBoard。</li>
        <li><strong>容器与状态</strong>：FullScreenContainer、Loading。</li>
      </ul>
    </section>

    <section class="guide-doc__section">
      <h2>实现说明</h2>
      <ul class="guide-list">
        <li>BorderBox、Decoration、Loading、PercentPond、Flyline 等使用响应式 SVG、CSS 与 SMIL 重构。</li>
        <li>WaterLevelPond 使用响应式 SVG 波浪、裁剪与渐变实现，不依赖 Canvas 运行时。</li>
        <li>Charts 直接封装原生 ECharts，<code>option</code> 使用完整 <code>EChartsOption</code>，并暴露实例、事件与常用方法。</li>
        <li>连续动画支持页面隐藏、离开视口、悬停、键盘焦点与 <code>prefers-reduced-motion</code> 暂停。</li>
        <li>滚动组件使用循环窗口索引，不复制整份数据。</li>
      </ul>
    </section>
  </article>
</template>
