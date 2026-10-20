<script setup lang="ts">
import lumalLogoUrl from '../../assets/lumal-logo.svg'
import { adminBuildInfo } from '../../services/app-info'
import AboutInfoSection from './components/AboutInfoSection.vue'

/***********************基本信息*********************/
const buildTime = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  hour12: false,
  timeStyle: 'medium',
  timeZone: 'Asia/Shanghai',
}).format(new Date(adminBuildInfo.builtAt))

const environmentLabels: Record<string, string> = {
  development: '开发环境',
  production: '生产环境',
}
const environment = environmentLabels[adminBuildInfo.mode] ?? adminBuildInfo.mode

const basicInfo = [
  { highlight: true, label: '框架版本', value: adminBuildInfo.version },
  { datetime: adminBuildInfo.builtAt, label: '最近构建时间（UTC+8）', value: buildTime },
  { label: '提交标识', value: adminBuildInfo.commit },
  { label: '开源许可协议', value: adminBuildInfo.license },
  { href: 'https://luma-docs-seven.vercel.app', label: '文档地址', value: 'Lumal 文档' },
  { href: 'https://lumal-admin-demo.vercel.app', label: '预览地址', value: 'Lumal Admin' },
  { href: 'https://github.com/cuteyuchen/lumal', label: 'GitHub', value: 'cuteyuchen/lumal' },
  { label: '构建环境', value: environment },
]

/***********************依赖版本快照*********************/
const dependencySections = [
  { title: '生产环境依赖', versions: adminBuildInfo.dependencies },
  { title: '开发环境依赖', versions: adminBuildInfo.devDependencies },
].map(section => ({
  title: section.title,
  items: Object.entries(section.versions).map(([label, value]) => ({ label, value })),
}))
</script>

<template>
  <main class="lumal-admin-about">
    <header class="lumal-admin-about__header">
      <img class="lumal-admin-about__logo" :src="lumalLogoUrl" alt="" aria-hidden="true">
      <div class="lumal-admin-about__heading">
        <div class="lumal-admin-about__title-row">
          <h1 class="lumal-admin-about__title">
            关于项目
          </h1>
          <span class="lumal-admin-about__version" aria-label="当前框架版本">v{{ adminBuildInfo.version }}</span>
        </div>
        <p class="lumal-admin-about__description">
          Lumal Admin · 轻量 Vue 管理后台
        </p>
      </div>
    </header>

    <AboutInfoSection title="基本信息" :items="basicInfo" />
    <AboutInfoSection
      v-for="section in dependencySections"
      :key="section.title"
      :title="section.title"
      :items="section.items"
    />
  </main>
</template>

<style scoped lang="scss">
.lumal-admin-about {
  width: 100%;
  min-width: 0;
  background: var(--el-bg-color);
}

.lumal-admin-about__header {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
  padding: 24px;
}

.lumal-admin-about__logo {
  width: 48px;
  height: 48px;
  flex: none;
}

.lumal-admin-about__heading {
  min-width: 0;
}

.lumal-admin-about__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.lumal-admin-about__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 6px);
  font-weight: 600;
  line-height: 1.5;
}

.lumal-admin-about__version {
  max-width: 100%;
  padding: 2px 8px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 4px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  overflow-wrap: anywhere;
  font-size: var(--lumal-font-size-base, 14px);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.6;
}

.lumal-admin-about__description {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
  font-size: var(--lumal-font-size-base, 14px);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .lumal-admin-about__header {
    align-items: flex-start;
    gap: 12px;
    padding: 20px 16px;
  }

  .lumal-admin-about__logo {
    width: 40px;
    height: 40px;
  }
}
</style>
