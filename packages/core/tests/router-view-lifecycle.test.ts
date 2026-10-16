import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onUnmounted, shallowRef } from 'vue'
import { createMemoryHistory, createRouter, useRoute } from 'vue-router'
import LumalRouterView from '../src/layout/LumalRouterView.vue'

describe('router view lifecycle', () => {
  it('默认或非法无限容量回退到最多 20 个缓存实例', async () => {
    const destroyed = vi.fn()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: Array.from({ length: 21 }, (_, index) => ({
        path: `/view-${index}`,
        component: defineComponent({
          setup() {
            onUnmounted(() => destroyed(index))
            return () => h('div', String(index))
          },
        }),
      })),
    })
    await router.push('/view-0')
    const Host = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, { cache: true, cacheMax: Number.POSITIVE_INFINITY, viewKey: route.path })
      },
    })
    const wrapper = mount(Host, { global: { plugins: [router] } })
    try {
      for (let index = 1; index <= 20; index++) {
        await router.push(`/view-${index}`)
        await flushPromises()
      }
      expect(destroyed).toHaveBeenCalledExactlyOnceWith(0)
    }
    finally {
      wrapper.unmount()
    }
    expect(destroyed).toHaveBeenCalledTimes(21)
  })

  it('关闭和刷新会销毁旧实例，并遵守路由的 keepAlive=false', async () => {
    const destroyed = vi.fn()
    const view = (name: string) => defineComponent({
      name,
      setup() {
        onUnmounted(() => destroyed(name))
        return () => h('div', name)
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: view('ViewA') },
        { path: '/b', component: view('ViewB') },
        { path: '/c', component: view('ViewC'), meta: { keepAlive: false } },
      ],
    })
    await router.push('/a')
    const keys = shallowRef(['/a:0', '/b:0', '/c:0'])
    const version = shallowRef(0)
    const root = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, {
          cache: true,
          cacheKeys: keys.value,
          viewKey: `${route.path}:${route.path === '/a' ? version.value : 0}`,
        })
      },
    })
    const wrapper = mount(root, { global: { plugins: [router] } })
    try {
      await router.push('/b')
      await flushPromises()
      expect(destroyed).not.toHaveBeenCalledWith('ViewA')
      keys.value = ['/b:0', '/c:0']
      await flushPromises()
      expect(destroyed).toHaveBeenCalledWith('ViewA')
      keys.value = ['/a:0', '/b:0', '/c:0']
      await router.push('/a')
      await flushPromises()
      version.value = 1
      keys.value = ['/a:1', '/b:0', '/c:0']
      await flushPromises()
      expect(destroyed.mock.calls.filter(([name]) => name === 'ViewA')).toHaveLength(2)
      await router.push('/c')
      await router.push('/b')
      await flushPromises()
      expect(destroyed).toHaveBeenCalledWith('ViewC')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('导航守卫仍在等待时持续反馈，成功或失败后立即停止', async () => {
    let finish!: () => void
    const View = defineComponent({ render: () => h('div', 'view') })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/a', component: View }, { path: '/b', component: View }],
    })
    await router.push('/a')
    const wrapper = mount(LumalRouterView, {
      props: { progress: true, loading: true },
      global: { plugins: [router] },
    })
    const remove = router.beforeResolve(() => new Promise<void>((resolve) => {
      finish = resolve
    }))
    try {
      const navigation = router.push('/b')
      await vi.waitFor(() => expect(wrapper.find('.lumal-router-view__progress').exists()).toBe(true))
      finish()
      await navigation
      await flushPromises()
      expect(wrapper.find('.lumal-router-view__loading').exists()).toBe(false)
      remove()
      router.beforeResolve(() => false)
      await router.push('/a')
      await flushPromises()
      expect(wrapper.find('.lumal-router-view__progress').exists()).toBe(false)
    }
    finally {
      wrapper.unmount()
    }
  })
})
