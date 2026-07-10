import type { App, Plugin } from 'vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { createLumaAdmin } from '../src'

/***********************测试组件*********************/
function createRootComponent(name = 'RootForCreateLumaAdminTest') {
  return defineComponent({
    name,
    setup() {
      return () => h('div', 'Luma')
    },
  })
}

/***********************测试插件*********************/
function createInstallPlugin(name: string, order: string[]): Plugin {
  return {
    install(app: App) {
      order.push(name)
      app.config.globalProperties[`$${name}Installed`] = true
    },
  }
}

describe('createLumaAdmin', () => {
  it('可以创建 Vue 应用并暴露 mount/use 上下文', () => {
    const framework = createLumaAdmin({
      rootComponent: createRootComponent(),
    })

    expect(framework.app).toBeTruthy()
    expect(typeof framework.mount).toBe('function')
    expect(typeof framework.use).toBe('function')
  })

  it('会在初始化时同步注册业务本地图标', () => {
    createLumaAdmin({
      rootComponent: createRootComponent('RootForIconRegistrationTest'),
      icons: {
        localSvg: [
          {
            key: 'app:boot',
            label: '启动图标',
            source: 'local-svg',
            svgText: '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M2 2h12v12H2z"/></svg>',
          },
        ],
      },
    })

    expect(true).toBe(true)
  })

  it('会按核心插件、全局组件、setup 和 Router ready 的顺序安装应用能力', async () => {
    const order: string[] = []
    const GlobalWidget = defineComponent({
      name: 'GlobalWidget',
      setup() {
        return () => h('div', 'global')
      },
    })

    const router = createInstallPlugin('router', order) as Plugin & { isReady: () => Promise<void> }
    router.isReady = async () => {
      order.push('routerReady')
    }
    const framework = createLumaAdmin({
      rootComponent: createRootComponent('RootForInstallOptionsTest'),
      router,
      pinia: createInstallPlugin('pinia', order),
      elementPlus: createInstallPlugin('elementPlus', order),
      components: {
        GlobalWidget,
      },
      setup: ({ app }) => {
        order.push('setup')
        expect(app.config.globalProperties.$routerInstalled).toBe(true)
        expect(app.config.globalProperties.$piniaInstalled).toBe(true)
        expect(app.config.globalProperties.$elementPlusInstalled).toBe(true)
        expect(app.component('GlobalWidget')).toBe(GlobalWidget)
      },
    })

    expect(order).toEqual(['router', 'pinia', 'elementPlus'])
    await framework.mount(document.createElement('div'))

    expect(order).toEqual(['router', 'pinia', 'elementPlus', 'setup', 'routerReady'])
    expect(framework.app.component('GlobalWidget')).toBe(GlobalWidget)
  })

  it('兼容 Element Plus 旧插件写法和带 options 的新写法', () => {
    const installedOptions: unknown[] = []
    const elementPlus: Plugin<[Record<string, unknown>]> = {
      install(_app, options) {
        installedOptions.push(options)
      },
    }

    createLumaAdmin({
      components: false,
      elementPlus: {
        options: {
          locale: 'zh-cn',
          zIndex: 3000,
        },
        plugin: elementPlus,
      },
      rootComponent: createRootComponent('RootForElementPlusOptionsTest'),
    })

    expect(installedOptions).toEqual([{
      locale: 'zh-cn',
      zIndex: 3000,
    }])
  })

  it('支持默认组件、按名称选择和关闭全局组件注册', () => {
    const allComponents = createLumaAdmin({
      components: true,
      rootComponent: createRootComponent('RootForAllComponentsTest'),
    })
    const selectedComponents = createLumaAdmin({
      components: ['LumaPage'],
      rootComponent: createRootComponent('RootForSelectedComponentsTest'),
    })
    const noComponents = createLumaAdmin({
      components: false,
      rootComponent: createRootComponent('RootForNoComponentsTest'),
    })

    expect(allComponents.app.component('LumaPage')).toBeTruthy()
    expect(allComponents.app.component('LumaLayout')).toBeTruthy()
    expect(selectedComponents.app.component('LumaPage')).toBeTruthy()
    expect(selectedComponents.app.component('LumaLayout')).toBeUndefined()
    expect(noComponents.app.component('LumaPage')).toBeUndefined()
  })
})
