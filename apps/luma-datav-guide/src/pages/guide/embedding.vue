<script setup lang="ts">
import CodeBlock from '@/components/CodeBlock.vue'

const buildExample = `# 构建静态站点，产物在 apps/luma-datav-guide/dist
pnpm --filter luma-datav-guide build

# 本地预览
pnpm --filter luma-datav-guide preview`

const blankExample = `// apps/luma-admin/src/router/routes.ts
{
  children: [
    {
      externalLink: 'https://your-host.com/datav-guide/',
      name: 'DatavGuideExternal',
      path: 'datav-guide',
      meta: {
        externalTarget: '_blank', // 新标签打开
        icon: 'app:examples',
        order: 1,
        title: 'DataV 组件指南',
      },
    },
  ],
  name: 'Resources',
  path: '/resources',
  redirect: '/resources/datav-guide',
  meta: { icon: 'app:examples', order: 5, title: '资源' },
}`

const frameExample = `// 在 Admin 内以 iframe 内嵌，复用现成的 shared/external-frame 视图
{
  component: 'shared/external-frame',
  externalLink: 'https://your-host.com/datav-guide/',
  name: 'DatavGuideEmbed',
  path: 'datav-guide-embed',
  meta: {
    externalTarget: '_self', // 站内 iframe 内嵌
    icon: 'app:examples',
    order: 2,
    title: 'DataV 组件指南（内嵌）',
  },
}`

const menuExample = `{
  "title": "DataV 组件指南",
  "type": "MENU",
  "externalLink": "https://your-host.com/datav-guide/",
  "externalTarget": "_self",
  "component": "shared/external-frame",
  "icon": "app:examples"
}`
</script>

<template>
  <article class="guide-doc">
    <header class="guide-doc__head">
      <p class="guide-doc__eyebrow">指南</p>
      <h1>嵌入 Admin</h1>
      <p class="guide-doc__lead">
        本指南是一个可独立构建的静态站点。构建后可托管到任意静态服务器，并以外链菜单的形式接入 Luma Admin，
        既能新标签打开，也能在后台内以 iframe 内嵌。
      </p>
    </header>

    <section class="guide-doc__section">
      <h2>1. 构建静态产物</h2>
      <p>
        应用使用 hash 路由，产物为纯静态文件，可直接放到 CDN、对象存储或 Nginx 目录下，无需服务端渲染。
      </p>
      <CodeBlock :code="buildExample" language="bash" />
    </section>

    <section class="guide-doc__section">
      <h2>2. 新标签打开</h2>
      <p>
        在 Admin 路由中声明 <code>externalLink</code> 并设置 <code>externalTarget: '_blank'</code>，
        菜单点击后在新标签打开指南站点。
      </p>
      <CodeBlock :code="blankExample" language="ts" />
    </section>

    <section class="guide-doc__section">
      <h2>3. 站内 iframe 内嵌</h2>
      <p>
        Admin 内置了 <code>shared/external-frame</code> 视图，把 <code>externalTarget</code> 设为
        <code>'_self'</code> 并将 <code>component</code> 指向该视图，即可在后台框架内用 iframe 内嵌本指南，
        保留左侧菜单与标签页。
      </p>
      <CodeBlock :code="frameExample" language="ts" />
    </section>

    <section class="guide-doc__section">
      <h2>4. 通过菜单数据下发</h2>
      <p>
        若菜单来自后端系统菜单接口，只需在菜单记录里填入相同字段即可，无需改动前端路由代码。
      </p>
      <CodeBlock :code="menuExample" language="json" />
    </section>

    <section class="guide-doc__note">
      <strong>提示：</strong>
      iframe 内嵌时，本站点会读取托管地址的同源资源；跨域托管时请确保静态服务器允许被
      Admin 域名以 iframe 加载（未设置 <code>X-Frame-Options: DENY</code> 或对应 CSP <code>frame-ancestors</code>）。
    </section>
  </article>
</template>
