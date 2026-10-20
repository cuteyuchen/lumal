import { describe, expect, it } from 'vitest'
import {
  createComponentIconDefinitions,
  createIconifyIconDefinitions,
  getRegisteredIconDefinitions,
  getRegisteredIconGroups,
  registerIconGroups,
  registerIcons,
  resolveIconDefinition,
  validateMonochromeSvg,
} from '../src'

describe('@lumal/icons registry', () => {
  it('会预注册框架通用图标', () => {
    expect(resolveIconDefinition('lumal:sun')).toMatchObject({ label: '浅色模式' })
    expect(resolveIconDefinition('lumal:moon')).toMatchObject({ label: '深色模式' })
    expect(resolveIconDefinition('lumal:monitor')).toMatchObject({ label: '跟随系统' })
    expect(resolveIconDefinition('lumal:settings')).toBeTruthy()
    expect(resolveIconDefinition('lumal:plus')).toMatchObject({ label: '新增' })
    expect(resolveIconDefinition('lumal:refresh')).toMatchObject({ label: '刷新' })
    expect(resolveIconDefinition('lumal:fullscreen')).toMatchObject({ label: '全屏' })
    expect(resolveIconDefinition('lumal:fullscreen-exit')).toMatchObject({ label: '退出全屏' })
    expect(resolveIconDefinition('lumal:grid')).toMatchObject({ label: '列设置' })
    expect(resolveIconDefinition('lumal:filter')).toMatchObject({ label: '筛选' })
    for (const key of ['menu', 'search', 'arrow-up', 'arrow-down', 'arrow-right', 'copy', 'download']) {
      expect(resolveIconDefinition(`lumal:${key}`)).toMatchObject({ group: 'lumal', source: 'local-svg' })
    }
  })

  it('设置图标的内圆居中，外齿轮对称且描边一致', () => {
    const svgText = resolveIconDefinition('lumal:settings')!.svgText!
    const svgDocument = new DOMParser().parseFromString(svgText, 'image/svg+xml')
    const svg = svgDocument.documentElement
    const circle = svg.querySelector('circle')
    const outline = svg.querySelector('path')

    expect(svgDocument.querySelector('parsererror')).toBeNull()
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(circle?.getAttribute('cx')).toBe('12')
    expect(circle?.getAttribute('cy')).toBe('12')
    expect(circle?.getAttribute('r')).toBe('3.5')
    // 顶部与底部齿槽以 (12, 12) 为中心，防止相对坐标再次累积偏移。
    expect(outline?.getAttribute('d')).toMatch(/^M10 3h4/)
    expect(outline?.getAttribute('d')).toContain('L14 21h-4')
    for (const shape of svg.querySelectorAll('path, circle')) {
      expect(shape.getAttribute('stroke')).toBe('currentColor')
      expect(shape.getAttribute('stroke-width')).toBe('1.8')
    }
    expect(validateMonochromeSvg(svgText).valid).toBe(true)
  })

  it('注册图标后可以按 key 同步解析', () => {
    registerIcons([
      {
        key: 'app:dashboard',
        label: '控制台',
        source: 'local-svg',
        svgText: '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M2 2h5v5H2z"/></svg>',
      },
    ])

    expect(resolveIconDefinition('app:dashboard')).toMatchObject({
      key: 'app:dashboard',
      label: '控制台',
      source: 'local-svg',
    })
    expect(getRegisteredIconDefinitions().some(icon => icon.key === 'app:dashboard')).toBe(true)
  })

  it('注册图标分组后可以被图标选择器读取', () => {
    registerIconGroups([
      {
        key: 'app',
        label: '应用',
        order: 20,
      },
      {
        key: 'base',
        label: '基础',
        order: 10,
      },
    ])

    expect(getRegisteredIconGroups().slice(0, 2).map(group => group.key)).toEqual(['base', 'app'])
    expect(resolveIconDefinition('missing:key')).toBeUndefined()
  })

  it('可以批量创建组件和 Iconify 图标定义', () => {
    const component = { name: 'MockIcon' }

    expect(createComponentIconDefinitions('element-plus', { Edit: component })).toEqual([
      expect.objectContaining({ component, key: 'element-plus:Edit', source: 'component' }),
    ])
    expect(createIconifyIconDefinitions('mdi', ['home'])).toEqual([
      expect.objectContaining({ icon: 'home', key: 'mdi:home', source: 'iconify' }),
    ])
  })
})
