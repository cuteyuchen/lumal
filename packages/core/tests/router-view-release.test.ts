import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onUnmounted } from 'vue'
import { createMemoryHistory, createRouter, useRoute } from 'vue-router'
import LumalRouterView from '../src/layout/LumalRouterView.vue'

describe('release router view regression', () => {
  it.each([
    { cache: true, transition: true },
    { cache: true, transition: false },
    { cache: false, transition: true },
    { cache: false, transition: false },
  ])('普通路由、403/404 和 props 在真实过渡下完整呈现（cache=$cache，transition=$transition）', async ({ cache, transition }) => {
    const destroyed = vi.fn()
    const warn = vi.fn()
    const Page = defineComponent({
      props: { title: String },
      setup(props) {
        onUnmounted(() => destroyed(props.title))
        return () => [h('h1', props.title), h('aside', `details:${props.title}`)]
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', component: Page, props: { title: 'Home' } },
        { path: '/403', component: Page, props: { title: 'Forbidden' }, meta: { keepAlive: false } },
        { path: '/404', component: Page, props: { title: 'Not found' }, meta: { keepAlive: false } },
      ],
    })
    await router.push('/home')
    const Host = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, { cache, transition, viewKey: route.path, cacheKeys: ['/home'] })
      },
    })
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { plugins: [router], stubs: { transition: false }, config: { warnHandler: message => warn(message) } },
    })
    try {
      for (const [path, title] of [['/403', 'Forbidden'], ['/404', 'Not found'], ['/home', 'Home']]) {
        await router.push(path!)
        await vi.waitFor(() => expect(wrapper.find('h1').text()).toBe(title))
        expect(wrapper.get('aside').text()).toBe(`details:${title}`)
      }
      expect(destroyed).toHaveBeenCalledWith('Forbidden')
      expect(destroyed).toHaveBeenCalledWith('Not found')
      expect(destroyed.mock.calls.filter(([name]) => name === 'Home')).toHaveLength(cache ? 0 : 1)
      expect(warn).not.toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
    }
    expect(destroyed.mock.calls.filter(([name]) => name === 'Home')).toHaveLength(cache ? 1 : 2)
  })

  it('cacheMax 淘汰最久未访问实例，卸载会释放剩余缓存和路由订阅', async () => {
    const destroyed = vi.fn()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ['a', 'b', 'c'].map(name => ({
        path: `/${name}`,
        component: defineComponent({
          setup() {
            onUnmounted(() => destroyed(name))
            return () => h('section', name)
          },
        }),
      })),
    })
    await router.push('/a')
    const removals = [vi.fn(), vi.fn(), vi.fn()]
    const subscriptions = [
      vi.spyOn(router, 'beforeEach').mockReturnValue(removals[0]!),
      vi.spyOn(router, 'afterEach').mockReturnValue(removals[1]!),
      vi.spyOn(router, 'onError').mockReturnValue(removals[2]!),
    ]
    const Host = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, { cache: true, cacheMax: 2, viewKey: route.path })
      },
    })
    const wrapper = mount(Host, { global: { plugins: [router] } })
    try {
      for (const path of ['/b', '/a', '/c']) {
        await router.push(path)
        await flushPromises()
      }
      expect(destroyed).toHaveBeenCalledExactlyOnceWith('b')
    }
    finally {
      wrapper.unmount()
      subscriptions.forEach(spy => spy.mockRestore())
    }
    expect(destroyed.mock.calls.map(([name]) => name).sort()).toEqual(['a', 'b', 'c'])
    removals.forEach(remove => expect(remove).toHaveBeenCalledOnce())
  })
})
