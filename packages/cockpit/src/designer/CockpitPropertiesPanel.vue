<script setup lang="ts">
import type { UseCockpitDraftReturn } from './useCockpitDraft'
import { computed } from 'vue'

/***********************分类与页面管理*********************/
// 分类 / 页面的增删改、复制与排序。删除需确认。

const props = defineProps<{
  draft: UseCockpitDraftReturn
}>()

const categories = computed(() => props.draft.draft.value!.categories)
const pages = computed(() => props.draft.activeCategory.value?.pages ?? [])
const activeCategoryId = computed(() => props.draft.activeCategory.value?.id)
const activePageId = computed(() => props.draft.activePage.value?.id)

function confirmRemove(message: string): boolean {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function')
    return true
  // 危险删除操作需要确认，符合无障碍与交互要求
  // eslint-disable-next-line no-alert
  return window.confirm(message)
}

function removeCategory(id: string, label: string): void {
  if (categories.value.length <= 1)
    return
  if (confirmRemove(`确认删除分类「${label}」？`))
    props.draft.removeCategory(id)
}

function removePage(id: string, title: string): void {
  if (pages.value.length <= 1)
    return
  if (confirmRemove(`确认删除页面「${title}」？`))
    props.draft.removePage(id)
}
</script>

<template>
  <div class="luma-cockpit-designer__properties">
    <!-- 分类管理 -->
    <section class="luma-cockpit-designer__props-section">
      <header class="luma-cockpit-designer__props-title">
        <span>分类</span>
        <button type="button" @click="draft.addCategory()">
          新增分类
        </button>
      </header>
      <ul class="luma-cockpit-designer__props-list">
        <li
          v-for="(category, ci) in categories"
          :key="category.id"
          class="luma-cockpit-designer__props-item"
          :class="{ 'is-active': category.id === activeCategoryId }"
        >
          <button
            type="button"
            class="luma-cockpit-designer__props-select"
            :aria-current="category.id === activeCategoryId ? 'true' : undefined"
            @click="draft.selectCategory(category.id)"
          >
            {{ category.label }}
          </button>
          <input
            class="luma-cockpit-designer__rename"
            :value="category.label"
            :aria-label="`重命名分类 ${category.label}`"
            @change="draft.renameCategory(category.id, ($event.target as HTMLInputElement).value)"
          >
          <span class="luma-cockpit-designer__ops">
            <button type="button" :disabled="ci === 0" aria-label="上移分类" @click="draft.moveCategory(category.id, -1)">↑</button>
            <button type="button" :disabled="ci === categories.length - 1" aria-label="下移分类" @click="draft.moveCategory(category.id, 1)">↓</button>
            <button type="button" aria-label="复制分类" @click="draft.duplicateCategory(category.id)">复制</button>
            <button
              type="button"
              aria-label="删除分类"
              :disabled="categories.length <= 1"
              @click="removeCategory(category.id, category.label)"
            >删除</button>
          </span>
        </li>
      </ul>
    </section>

    <!-- 页面管理 -->
    <section class="luma-cockpit-designer__props-section">
      <header class="luma-cockpit-designer__props-title">
        <span>页面</span>
        <button type="button" @click="draft.addPage()">
          新增页面
        </button>
      </header>
      <ul class="luma-cockpit-designer__props-list">
        <li
          v-for="(page, pi) in pages"
          :key="page.id"
          class="luma-cockpit-designer__props-item"
          :class="{ 'is-active': page.id === activePageId }"
        >
          <button
            type="button"
            class="luma-cockpit-designer__props-select"
            :aria-current="page.id === activePageId ? 'page' : undefined"
            @click="draft.selectPage(page.id)"
          >
            {{ page.title }}
          </button>
          <input
            class="luma-cockpit-designer__rename"
            :value="page.title"
            :aria-label="`重命名页面 ${page.title}`"
            @change="draft.renamePage(page.id, ($event.target as HTMLInputElement).value)"
          >
          <span class="luma-cockpit-designer__ops">
            <button type="button" :disabled="pi === 0" aria-label="上移页面" @click="draft.movePage(page.id, -1)">↑</button>
            <button type="button" :disabled="pi === pages.length - 1" aria-label="下移页面" @click="draft.movePage(page.id, 1)">↓</button>
            <button type="button" aria-label="复制页面" @click="draft.duplicatePage(page.id)">复制</button>
            <button
              type="button"
              aria-label="删除页面"
              :disabled="pages.length <= 1"
              @click="removePage(page.id, page.title)"
            >删除</button>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
