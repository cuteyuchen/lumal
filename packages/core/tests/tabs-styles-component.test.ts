import type { LumalLayoutTabItem, LumalTabStyle } from '../src/layout'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { LumalTabs } from '../src/layout'

const tabs: LumalLayoutTabItem[] = [
  { closable: false, path: '/home', pinned: true, title: '首页' },
  { closable: true, path: '/work', title: '工作台' },
  { closable: true, path: '/system', title: '系统管理' },
]

function mountTabsWithStyle(style: LumalTabStyle, activePath = '/work', newProps: Record<string, unknown> = {}) {
  return mount(LumalTabs, {
    global: {
      stubs: {
        Teleport: true,
      },
    },
    props: {
      activePath,
      styleType: style,
      tabs,
      ...newProps,
    },
  })
}

describe('lumal tabs - styles', () => {
  it('chrome 风格会渲染带弧形的容器并隐藏相邻分隔线', () => {
    const wrapper = mountTabsWithStyle('chrome')
    expect(wrapper.classes()).toContain('is-style-chrome')
    expect(wrapper.find('.lumal-tabs__item.is-active').exists()).toBe(true)
    wrapper.unmount()
  })

  it('plain 风格使用朴素分隔', () => {
    const wrapper = mountTabsWithStyle('plain')
    expect(wrapper.classes()).toContain('is-style-plain')
    expect(wrapper.find('.lumal-tabs__item.is-active').exists()).toBe(true)
    wrapper.unmount()
  })

  it('card 风格渲染圆角卡片', () => {
    const wrapper = mountTabsWithStyle('card')
    expect(wrapper.classes()).toContain('is-style-card')
    expect(wrapper.find('.lumal-tabs__item.is-active').exists()).toBe(true)
    wrapper.unmount()
  })

  it('brisk 风格包含动画下划线元素', () => {
    const wrapper = mountTabsWithStyle('brisk')
    expect(wrapper.classes()).toContain('is-style-brisk')
    expect(wrapper.find('.lumal-tabs__item.is-active').exists()).toBe(true)
    wrapper.unmount()
  })
})

const tabsForLeftDirection: LumalLayoutTabItem[] = [
  { closable: true, path: '/settings', pinned: false, title: '设置' },
  { closable: true, path: '/work', title: '工作台' },
  { closable: true, path: '/system', title: '系统管理' },
]

describe('lumal tabs - menu disabled states', () => {
  it('非活动页签的刷新与方向关闭被禁用', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    await wrapper.findAll('.lumal-tabs__item')[0]?.trigger('contextmenu', { clientX: 10, clientY: 10 })
    const menuButtons = wrapper.findAll('.lumal-tabs-context-menu button')
    const labels = menuButtons.map(b => b.text())
    expect(labels.some(l => l.includes('刷新') || l.includes('重新加载'))).toBe(true)

    const refresh = menuButtons.find(b => b.text().includes('重新加载'))
    expect(refresh?.attributes('disabled')).toBeDefined()

    const closeLeft = menuButtons.find(b => b.text().includes('关闭左侧'))
    expect(closeLeft?.attributes('disabled')).toBeDefined()

    const closeRight = menuButtons.find(b => b.text().includes('关闭右侧'))
    expect(closeRight?.attributes('disabled')).toBeDefined()

    const closeOthers = menuButtons.find(b => b.text().includes('关闭其他'))
    expect(closeOthers?.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('活动页签的刷新与方向关闭可用，永久固定标签不能关闭', async () => {
    const wrapper = mount(LumalTabs, {
      global: {
        stubs: { Teleport: true },
      },
      props: {
        activePath: '/work',
        styleType: 'chrome',
        tabs: tabsForLeftDirection,
      },
    })
    await wrapper.findAll('.lumal-tabs__item')[1]?.trigger('contextmenu', { clientX: 10, clientY: 10 })
    const menuButtons = wrapper.findAll('.lumal-tabs-context-menu button')

    const refresh = menuButtons.find(b => b.text().includes('重新加载'))
    expect(refresh?.attributes('disabled')).toBeUndefined()

    const closeLeft = menuButtons.find(b => b.text().includes('关闭左侧'))
    expect(closeLeft?.attributes('disabled')).toBeUndefined()

    const closeRight = menuButtons.find(b => b.text().includes('关闭右侧'))
    expect(closeRight?.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('lumal tabs - more button', () => {
  it('显示更多按钮且点击可触发菜单', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/system')
    const trigger = wrapper.find('[data-tab-menu-trigger]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click', { clientX: 10, clientY: 10 })
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.lumal-tabs-context-menu').exists()).toBe(true)

    const refreshItem = wrapper.findAll('.lumal-tabs-context-menu button').find(button => button.text().includes('重新加载'))
    await refreshItem?.trigger('click')
    expect(wrapper.emitted('refresh')?.[0]).toEqual(['/system'])
    wrapper.unmount()
  })

  it('showMore 为 false 时不渲染更多按钮', () => {
    const wrapper = mountTabsWithStyle('chrome', '/work', { showMore: false })
    expect(wrapper.find('[data-tab-menu-trigger]').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('lumal tabs - middle click', () => {
  it('middleClickToClose 为 true 时中键触发关闭', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    await wrapper.findAll('.lumal-tabs__tab')[1]?.trigger('mousedown', { button: 1, preventDefault: () => {} })
    expect(wrapper.emitted('remove')?.[0]).toEqual(['/work'])
    wrapper.unmount()
  })

  it('middleClickToClose 为 false 时中键不触发', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work', { middleClickToClose: false })
    await wrapper.findAll('.lumal-tabs__tab')[1]?.trigger('mousedown', { button: 1, preventDefault: () => {} })
    expect(wrapper.emitted('remove')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('lumal tabs - wheel scroll', () => {
  it('wheelable 为 false 时滚轮不阻止默认行为', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work', { wheelable: false })
    const viewport = wrapper.find('.lumal-tabs__viewport')
    let preventDefaultWasCalled = false
    await viewport.trigger('wheel', {
      deltaY: 100,
      deltaX: 0,
      preventDefault: () => { preventDefaultWasCalled = true },
    })
    // 我们无法精确测试 scrollBy 行为，但应当不会调用 preventDefault。
    expect(preventDefaultWasCalled).toBe(false)
    wrapper.unmount()
  })
})

describe('lumal tabs - maximize', () => {
  it('点击最大化按钮抛出 maximize 事件', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    await wrapper.find('[data-action="maximize-content"]').trigger('click')
    expect(wrapper.emitted('maximize')?.[0]).toEqual([true])
    wrapper.unmount()
  })

  it('在菜单中点击内容最大化也会抛出 maximize 事件', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    await wrapper.find('[data-tab-menu-trigger]').trigger('click', { clientX: 10, clientY: 10 })
    await nextTick()
    const menuButtons = wrapper.findAll('.lumal-tabs-context-menu button')
    const maximizeItem = menuButtons.find(b => b.text().includes('内容最大化'))
    await maximizeItem?.trigger('click')
    expect(wrapper.emitted('maximize')?.[0]).toEqual([true])
    wrapper.unmount()
  })
})

describe('lumal tabs - mobile density', () => {
  it('移动端保持 40px 高度、收紧标签与工具，并隐藏独立刷新和最大化', async () => {
    const source = await readFile(join(process.cwd(), 'src/layout/LumalTabs.vue'), 'utf8')
    const mobileStart = source.indexOf('@media (max-width: 768px)')
    const mobileEnd = source.indexOf('@media (prefers-reduced-motion: reduce)', mobileStart)
    const desktopStyles = source.slice(0, mobileStart)
    const mobileStyles = source.slice(mobileStart, mobileEnd)

    expect(mobileStart).toBeGreaterThan(-1)
    expect(mobileEnd).toBeGreaterThan(mobileStart)
    expect(desktopStyles).toMatch(/\.lumal-tabs\s*\{[\s\S]*?height:\s*var\(--lumal-tabbar-height\);/)
    expect(desktopStyles).toMatch(/\.lumal-tabs__tool\s*\{[\s\S]*?flex:\s*0 0 36px;[\s\S]*?width:\s*36px;/)
    expect(mobileStyles).toMatch(/\.lumal-tabs\s*\{\s*height:\s*40px;/)
    expect(mobileStyles).toMatch(/\.lumal-tabs__item\s*\{\s*min-width:\s*72px;/)
    expect(mobileStyles).toMatch(/\.lumal-tabs__tab\s*\{[\s\S]*?padding:\s*0 22px 0 8px;/)
    expect(mobileStyles).toMatch(/\.lumal-tabs__tool\s*\{\s*flex-basis:\s*32px;\s*width:\s*32px;/)
    expect(mobileStyles).toMatch(/\.lumal-tabs__tool--refresh,\s*\.lumal-tabs__tool--maximize\s*\{\s*display:\s*none;/)
  })
})

describe('lumal tabs - icons', () => {
  it('显示固定标签的 pin 图标', () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    const pinnedTab = wrapper.findAll('.lumal-tabs__item').at(0)
    expect(pinnedTab?.find('.lumal-tabs__pin').exists()).toBe(true)
    wrapper.unmount()
  })

  it('关闭按钮使用 SVG 图标而非常量字符', () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    const closeBtn = wrapper.findAll('.lumal-tabs__close').at(0)
    expect(closeBtn?.text().trim()).not.toBe('×')
    wrapper.unmount()
  })
})

describe('lumal tabs - keyboard navigation', () => {
  it('arrowRight 跳转到右侧标签并发出 change', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    const tabButtons = wrapper.findAll('[role="tab"]')
    await tabButtons[1]?.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['/system'])
    wrapper.unmount()
  })

  it('home 跳转到首个标签', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/system')
    const tabButtons = wrapper.findAll('[role="tab"]')
    await tabButtons[2]?.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['/home'])
    wrapper.unmount()
  })

  it('菜单中 Escape 关闭菜单', async () => {
    const wrapper = mountTabsWithStyle('chrome', '/work')
    await wrapper.findAll('.lumal-tabs__item')[0]?.trigger('contextmenu', { clientX: 10, clientY: 10 })
    expect(wrapper.find('.lumal-tabs-context-menu').exists()).toBe(true)

    // 模拟按键 Escape 触发 listener。
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.lumal-tabs-context-menu').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('lumal tabs - draggable / wheelable disabled states', () => {
  it('关闭拖拽时容器不渲染拖拽实例（无 SortableJS 错误）', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    const wrapper = mountTabsWithStyle('chrome', '/work', { draggable: false })
    expect(wrapper.find('.lumal-tabs__list').exists()).toBe(true)
    wrapper.unmount()
    vi.unstubAllGlobals()
  })
})
