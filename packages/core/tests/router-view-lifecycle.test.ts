import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onActivated, onDeactivated, onMounted, onUnmounted, shallowRef } from 'vue'
import { createMemoryHistory, createRouter, useRoute } from 'vue-router'
import LumalRouterView from '../src/layout/LumalRouterView.vue'

describe('router view lifecycle', () => {
  it.each([
    { cache: true, transition: true },
    { cache: true, transition: false },
    { cache: false, transition: true },
    { cache: false, transition: false },
  ])('真实页面切换不留空白并保持缓存语义（cache=$cache，transition=$transition）', async ({ cache, transition }) => {
    const mounted = vi.fn()
    const view = (name: string) => defineComponent({
      name,
      setup() {
        onMounted(() => mounted(name))
        return () => h('section', name)
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', component: view('DashboardView') },
        { path: '/about', component: view('AboutView') },
      ],
    })
    await router.push('/dashboard')
    const Host = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, {
          cache,
          cacheKeys: ['/dashboard:0', '/about:0'],
          transition,
          viewKey: `${route.path}:0`,
        })
      },
    })
    const wrapper = mount(Host, {
      attachTo: document.body,
      // 使用真实 Transition，覆盖 out-in 离场后能否继续渲染新页面。
      global: { plugins: [router], stubs: { transition: false } },
    })
    try {
      expect(wrapper.text()).toBe('DashboardView')
      for (const [path, name] of [
        ['/about', 'AboutView'],
        ['/dashboard', 'DashboardView'],
        ['/about', 'AboutView'],
      ]) {
        await router.push(path)
        await vi.waitFor(() => expect(wrapper.text()).toBe(name))
      }
      expect(mounted).toHaveBeenCalledTimes(cache ? 2 : 4)
    }
    finally {
      wrapper.unmount()
    }
  })

  it('未传 viewKey 时仍对不同组件执行过渡，并保留同组件路由间的实例复用', async () => {
    const mounted = vi.fn()
    const SharedView = defineComponent({
      setup() {
        const route = useRoute()
        const count = shallowRef(0)
        onMounted(mounted)
        return () => h('button', { onClick: () => count.value++ }, `${route.params.id}:${count.value}`)
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/start', component: defineComponent({ setup: () => () => h('section', 'start') }) },
        { path: '/items/:id', component: SharedView },
        { path: '/preview/:id', component: SharedView },
      ],
    })
    await router.push('/start')
    const wrapper = mount(LumalRouterView, {
      attachTo: document.body,
      props: { transition: true },
      global: { plugins: [router], stubs: { transition: false } },
    })
    try {
      await vi.waitFor(() => expect(wrapper.find('.fade-side-enter-active').exists()).toBe(false))
      await router.push('/items/one')
      expect(wrapper.find('.fade-side-leave-active').exists()).toBe(true)
      await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true))
      await wrapper.get('button').trigger('click')
      const button = wrapper.get('button').element

      for (const [path, text] of [['/items/two', 'two:1'], ['/preview/three', 'three:1']]) {
        await router.push(path)
        await flushPromises()
        expect(wrapper.get('button').element).toBe(button)
        expect(wrapper.get('button').text()).toBe(text)
      }
      expect(mounted).toHaveBeenCalledTimes(1)
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each([
    { cache: true, transition: true, keepAlive: true },
    { cache: true, transition: false, keepAlive: true },
    { cache: false, transition: true, keepAlive: true },
    { cache: false, transition: false, keepAlive: true },
    { cache: true, transition: true, keepAlive: false },
    { cache: true, transition: false, keepAlive: false },
  ])('多根页面可完整往返切换并按配置保留状态（cache=$cache，transition=$transition，keepAlive=$keepAlive）', async ({ cache, transition, keepAlive }) => {
    const activated = vi.fn()
    const deactivated = vi.fn()
    const mounted = vi.fn()
    const warn = vi.fn()
    const MultiRootView = defineComponent({
      name: 'MultiRootView',
      setup() {
        const count = shallowRef(0)
        onActivated(activated)
        onDeactivated(deactivated)
        onMounted(mounted)
        // 模拟正文与独立面板并列的多根页面，不能只保留第一个根节点。
        return () => [
          h('button', { 'data-testid': 'counter', 'onClick': () => count.value++ }, String(count.value)),
          h('aside', { 'data-testid': 'details' }, 'details'),
        ]
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/multi-root', component: MultiRootView, meta: { keepAlive } },
        { path: '/single-root', component: defineComponent({ setup: () => () => h('section', 'single-root') }) },
      ],
    })
    await router.push('/multi-root')
    const Host = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, {
          cache,
          cacheKeys: ['/multi-root:0', '/single-root:0'],
          transition,
          viewKey: `${route.path}:0`,
        })
      },
    })
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { transition: false }, config: { warnHandler: message => warn(message) } },
    })
    try {
      expect(wrapper.get('[data-testid="details"]').text()).toBe('details')
      await wrapper.get('[data-testid="counter"]').trigger('click')
      expect(wrapper.get('[data-testid="counter"]').text()).toBe('1')

      for (let index = 0; index < 2; index++) {
        await router.push('/single-root')
        await vi.waitFor(() => expect(wrapper.text()).toBe('single-root'))
        await router.push('/multi-root')
        await vi.waitFor(() => expect(wrapper.find('[data-testid="details"]').exists()).toBe(true))
        expect(wrapper.get('[data-testid="details"]').text()).toBe('details')
        expect(wrapper.get('[data-testid="counter"]').text()).toBe(cache && keepAlive ? '1' : '0')
      }
      expect(mounted).toHaveBeenCalledTimes(cache && keepAlive ? 1 : 3)
      expect(activated).toHaveBeenCalledTimes(cache && keepAlive ? 3 : 0)
      expect(deactivated).toHaveBeenCalledTimes(cache && keepAlive ? 2 : 0)
      expect(warn).not.toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
    }
  })

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

  it.each([false, true])('真实过渡下关闭和刷新会销毁旧实例，并遵守 keepAlive=false（多根=%s）', async (multipleRoots) => {
    const destroyed = vi.fn()
    const mounted = vi.fn()
    const warn = vi.fn()
    const view = (name: string) => defineComponent({
      name,
      setup() {
        onMounted(() => mounted(name))
        onUnmounted(() => destroyed(name))
        return () => multipleRoots
          ? [h('div', { 'data-testid': name }, name), h('aside', `${name} details`)]
          : h('div', { 'data-testid': name }, name)
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
          transition: true,
          viewKey: `${route.path}:${route.path === '/a' ? version.value : 0}`,
        })
      },
    })
    const wrapper = mount(root, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { transition: false }, config: { warnHandler: message => warn(message) } },
    })
    try {
      await router.push('/b')
      await vi.waitFor(() => expect(wrapper.find('[data-testid="ViewB"]').exists()).toBe(true))
      expect(destroyed).not.toHaveBeenCalledWith('ViewA')
      keys.value = ['/b:0', '/c:0']
      await flushPromises()
      expect(destroyed).toHaveBeenCalledWith('ViewA')
      keys.value = ['/a:0', '/b:0', '/c:0']
      await router.push('/a')
      await vi.waitFor(() => expect(wrapper.find('[data-testid="ViewA"]').exists()).toBe(true))
      const previousView = wrapper.get('[data-testid="ViewA"]').element
      version.value = 1
      keys.value = ['/a:1', '/b:0', '/c:0']
      await vi.waitFor(() => {
        expect(destroyed.mock.calls.filter(([name]) => name === 'ViewA')).toHaveLength(2)
        expect(wrapper.get('[data-testid="ViewA"]').element).not.toBe(previousView)
      })
      await router.push('/c')
      await vi.waitFor(() => expect(wrapper.find('[data-testid="ViewC"]').exists()).toBe(true))
      await router.push('/b')
      await vi.waitFor(() => expect(wrapper.find('[data-testid="ViewB"]').exists()).toBe(true))
      expect(destroyed).toHaveBeenCalledWith('ViewC')
      expect(destroyed).not.toHaveBeenCalledWith('ViewB')
      expect(mounted.mock.calls.filter(([name]) => name === 'ViewA')).toHaveLength(3)
      expect(mounted.mock.calls.filter(([name]) => name === 'ViewB')).toHaveLength(1)
      expect(warn).not.toHaveBeenCalled()
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
