import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { registerIcons } from '@lumal/icons'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumalIconPicker, LumalIconPickerDialog } from '../src'

// 直接检查编译器的 CSS AST，避免 jsdom 丢弃其尚不支持的 dvh 高度值。
function readStyleRules(component: string) {
  const source = readFileSync(resolve(process.cwd(), 'src/components', `${component}.vue`), 'utf8')
  const { descriptor } = parse(source)
  const { rawResult, errors } = compileStyle({
    id: 'picker-layout-test',
    source: descriptor.styles[0]!.content,
    scoped: false,
  })
  expect(errors).toEqual([])
  const rules: { selector: string, declarations: Record<string, string> }[] = []
  rawResult!.root.walkRules((rule) => {
    const declarations: Record<string, string> = {}
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
    rules.push({ selector: rule.selector, declarations })
  })
  return rules
}

describe('icon picker layout', () => {
  it('搜索框与原生分组控件共享默认 32px 的高度', () => {
    const rules = readStyleRules('LumalIconPicker')
    const controls = rules.find(rule => rule.selector.includes('.lumal-icon-picker__field input')
      && rule.selector.includes('.lumal-icon-picker__field select'))!.declarations

    expect(controls.height).toBe('var(--el-component-size, 32px)')
    expect(controls['min-height']).toBe(controls.height)
    expect(controls['box-sizing']).toBe('border-box')
  })

  it('名称模式提供加宽格子，并完整换行而非省略名称', () => {
    const rules = readStyleRules('LumalIconPicker')
    const grid = rules.find(rule => rule.selector === '.lumal-icon-picker--show-labels .lumal-icon-picker__grid')!.declarations
    const label = rules.find(rule => rule.selector === '.lumal-icon-picker__item-label')!.declarations

    expect(grid['grid-template-columns']).toContain('96px')
    expect(grid['grid-auto-rows']).toBe('minmax(84px, auto)')
    expect(label['white-space']).toBe('normal')
    expect(label['overflow-wrap']).toBe('anywhere')
    expect(label['text-overflow']).not.toBe('ellipsis')
  })

  it('弹窗保持固定视口高度，中间内容滚动且为滚动条预留宽度', () => {
    const rules = readStyleRules('LumalIconPickerDialog')
    const body = rules.find(rule => rule.selector === '.lumal-icon-picker-dialog__body')!.declarations
    const mobileBody = rules.find(rule => rule.selector === '.lumal-icon-picker-dialog.is-responsive .lumal-icon-picker-dialog__body')!.declarations
    const content = rules.find(rule => rule.selector === '.lumal-icon-picker-dialog__content')!.declarations

    expect(body.height).toBe('min(680px, 88dvh)')
    expect(body['grid-template-rows']).toBe('auto minmax(0, 1fr) auto')
    expect(mobileBody.height).toBe('min(680px, 92dvh)')
    expect(content.overflow).toBe('auto')
    expect(content['min-height']).toBe('0')
    expect(content['scrollbar-gutter']).toBe('stable')
  })

  it('弹窗的响应式列数均能排满一页，末页只展示真实剩余图标', async () => {
    registerIcons(Array.from({ length: 100 }, (_, index) => ({
      key: `layout-test:${index}`,
      group: 'layout-test',
      source: 'local-svg' as const,
      svgText: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
    })))
    const wrapper = mount(LumalIconPickerDialog, {
      props: { visible: true },
      global: { stubs: { Teleport: true } },
    })
    try {
      const pageSize = wrapper.getComponent(LumalIconPicker).props('pageSize')!
      const columns = readStyleRules('LumalIconPickerDialog')
        .filter(rule => rule.selector.includes('.lumal-icon-picker__grid'))
        .map(rule => Number(rule.declarations['grid-template-columns']!.match(/^repeat\((\d+),/)?.[1]))
      expect(columns).toEqual([8, 6, 4])
      for (const count of columns)
        expect(pageSize % count).toBe(0)

      await wrapper.get('select[aria-label="图标分组"]').setValue('layout-test')
      expect(wrapper.findAll('[role="option"]')).toHaveLength(pageSize)
      const next = wrapper.findAll('.lumal-icon-picker__pagination button')[1]!
      await next.trigger('click')
      expect(wrapper.findAll('[role="option"]')).toHaveLength(pageSize)
      await next.trigger('click')
      expect(wrapper.findAll('[role="option"]')).toHaveLength(4)
      expect(wrapper.get('[role="option"]').attributes('aria-label')).toBe('layout-test:96')
      expect(next.attributes()).toHaveProperty('disabled')
    }
    finally {
      wrapper.unmount()
    }
  })
})
