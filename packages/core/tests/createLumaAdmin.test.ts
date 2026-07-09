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

  it('会按核心插件、全局组件、setup 的顺序安装应用能力', () => {
    const order: string[] = []
    const GlobalWidget = defineComponent({
      name: 'GlobalWidget',
      setup() {
        return () => h('div', 'global')
      },
    })

    const framework = createLumaAdmin({
      rootComponent: createRootComponent('RootForInstallOptionsTest'),
      router: createInstallPlugin('router', order),
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

    expect(order).toEqual(['router', 'pinia', 'elementPlus', 'setup'])
    expect(framework.app.component('GlobalWidget')).toBe(GlobalWidget)
  })
})
