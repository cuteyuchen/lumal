import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { flatNavItems } from './navigation'

/**
 * 指南页与组件页分别放在 src/pages/guide 与 src/pages/components 下，
 * 文件名与 navigation.ts 的 slug 一一对应，这里用 import.meta.glob 懒加载装配。
 */
const guidePages = import.meta.glob('./pages/guide/*.vue')
const componentPages = import.meta.glob('./pages/components/*.vue')

function resolveLoader(slug: string): (() => Promise<unknown>) | undefined {
  const guideKey = `./pages/guide/${slug}.vue`
  if (guidePages[guideKey])
    return guidePages[guideKey]
  const componentKey = `./pages/components/${slug}.vue`
  return componentPages[componentKey]
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/introduction' },
  ...flatNavItems
    .map((item): RouteRecordRaw | undefined => {
      const loader = resolveLoader(item.slug)
      if (!loader)
        return undefined
      return {
        path: `/${item.slug}`,
        name: item.slug,
        component: loader,
        meta: { title: item.title, summary: item.summary },
      }
    })
    .filter((route): route is RouteRecordRaw => Boolean(route)),
  { path: '/:pathMatch(.*)*', redirect: '/introduction' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · @luma/datav` : '@luma/datav 组件指南'
})
