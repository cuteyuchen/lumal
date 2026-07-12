<script setup lang="ts">
import type {
  CockpitCategoryConfig,
  CockpitPageConfig,
} from '../types'
import { computed, ref } from 'vue'
import { useCanvasScale } from '../composables/useCanvasScale'
import { useCockpitRuntimeEnv } from './context'
import LumaCockpitCenterHost from './LumaCockpitCenterHost.vue'
import LumaCockpitRegion from './LumaCockpitRegion.vue'

/***********************基准画布*********************/
// 1920×1080 基准画布，等比缩放到实际窗口；内部含顶部、左右区域、中央与分类导航。

const props = defineProps<{
  title: string
  baseWidth: number
  baseHeight: number
  visibleCategories: CockpitCategoryConfig[]
  activeCategory?: CockpitCategoryConfig
  activePages: CockpitPageConfig[]
  activePage?: CockpitPageConfig
  onSelectCategory: (id: string) => void
  onSelectPage: (id: string) => void
}>()

const env = useCockpitRuntimeEnv()

const containerRef = ref<HTMLElement | null>(null)
const { result } = useCanvasScale(containerRef, {
  baseWidth: () => props.baseWidth,
  baseHeight: () => props.baseHeight,
})

const stageStyle = computed(() => ({
  width: `${props.baseWidth}px`,
  height: `${props.baseHeight}px`,
  transform: `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
  transformOrigin: 'top left',
}))

const hasCategories = computed(() => props.visibleCategories.length > 0)
</script>

<template>
  <div ref="containerRef" class="luma-cockpit-canvas" :data-scale="result.scale.toFixed(3)">
    <div class="luma-cockpit-canvas__stage" :style="stageStyle">
      <!-- 顶部区域 -->
      <header class="luma-cockpit-canvas__header">
        <div class="luma-cockpit-canvas__header-prefix">
          <component :is="env.slots['header-prefix']" v-if="env.slots['header-prefix']" />
        </div>
        <div class="luma-cockpit-canvas__title">
          <component :is="env.slots['header-title']" v-if="env.slots['header-title']" :title="title" />
          <h1 v-else>
            {{ title }}
          </h1>
        </div>
        <nav
          v-if="activePages.length > 0"
          class="luma-cockpit-canvas__pages"
          aria-label="页面选择"
        >
          <button
            v-for="page in activePages"
            :key="page.id"
            type="button"
            class="luma-cockpit-canvas__page"
            :class="{ 'is-active': page.id === activePage?.id }"
            :aria-current="page.id === activePage?.id ? 'page' : undefined"
            @click="onSelectPage(page.id)"
          >
            {{ page.title }}
          </button>
        </nav>
        <div class="luma-cockpit-canvas__header-actions">
          <component :is="env.slots['header-actions']" v-if="env.slots['header-actions']" />
        </div>
      </header>

      <!-- 主体：左 / 中 / 右 -->
      <div class="luma-cockpit-canvas__body">
        <template v-if="activePage">
          <LumaCockpitRegion
            class="luma-cockpit-canvas__left"
            side="left"
            :category-id="activeCategory!.id"
            :page-id="activePage.id"
            :region="activePage.left"
          />
          <LumaCockpitCenterHost
            class="luma-cockpit-canvas__center"
            :category-id="activeCategory!.id"
            :page-id="activePage.id"
            :center="activePage.center"
          />
          <LumaCockpitRegion
            class="luma-cockpit-canvas__right"
            side="right"
            :category-id="activeCategory!.id"
            :page-id="activePage.id"
            :region="activePage.right"
          />
        </template>
        <template v-else>
          <component :is="env.slots['empty-page']" v-if="env.slots['empty-page']" />
          <div v-else class="luma-cockpit-canvas__empty-page" role="status">
            当前页面为空
          </div>
        </template>
      </div>

      <!-- 分类切换区域：分类为空时不渲染 -->
      <nav
        v-if="hasCategories"
        class="luma-cockpit-canvas__categories"
        aria-label="分类导航"
      >
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          type="button"
          class="luma-cockpit-canvas__category"
          :class="{ 'is-active': category.id === activeCategory?.id }"
          :aria-current="category.id === activeCategory?.id ? 'true' : undefined"
          @click="onSelectCategory(category.id)"
        >
          <component
            :is="env.slots['category-item']"
            v-if="env.slots['category-item']"
            :category="category"
            :active="category.id === activeCategory?.id"
          />
          <span v-else>{{ category.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>
