import { describe, expect, it } from 'vitest'
import { COCKPIT_SCHEMA_VERSION } from '../src/config/defaults'
import { migrateCockpitConfig, needsMigration } from '../src/config/migrate'
import { normalizeCockpitConfig } from '../src/config/normalize'
import { validateCockpitConfig } from '../src/config/validate'

describe('normalizeCockpitConfig', () => {
  it('补齐缺失字段并保证可序列化', () => {
    const result = normalizeCockpitConfig({})
    expect(result.schemaVersion).toBe(COCKPIT_SCHEMA_VERSION)
    expect(result.categories).toEqual([])
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('非法权重归一为安全默认值', () => {
    const result = normalizeCockpitConfig({
      categories: [{
        id: 'c',
        label: 'c',
        pages: [{
          id: 'p',
          title: 'p',
          left: { columns: [{ id: 'col', width: -5, containers: [{ id: 'ct', height: 0, mode: 'single', widgets: [] }] }] },
          right: { columns: [] },
        }],
      }],
    })
    const col = result.categories[0].pages[0].left.columns[0]
    expect(col.width).toBeGreaterThan(0)
    expect(col.containers[0].height).toBeGreaterThan(0)
  })

  it('activeCategoryId 失效时回退到第一个可见分类', () => {
    const result = normalizeCockpitConfig({
      activeCategoryId: 'missing',
      categories: [{ id: 'real', label: 'r', pages: [{ id: 'p', title: 'p', left: { columns: [] }, right: { columns: [] } }] }],
    })
    expect(result.activeCategoryId).toBe('real')
  })

  it('single 模式只保留第一个可见模块', () => {
    const result = normalizeCockpitConfig({
      categories: [{
        id: 'c',
        label: 'c',
        pages: [{
          id: 'p',
          title: 'p',
          left: { columns: [{ id: 'col', width: 1, containers: [{
            id: 'ct',
            height: 1,
            mode: 'single',
            widgets: [
              { id: 'w1', type: 't', visible: true },
              { id: 'w2', type: 't', visible: true },
            ],
          }] }] },
          right: { columns: [] },
        }],
      }],
    })
    const widgets = result.categories[0].pages[0].left.columns[0].containers[0].widgets
    expect(widgets.filter(w => w.visible !== false)).toHaveLength(1)
  })

  it('tabs 默认项不存在时回退到第一个可见模块', () => {
    const result = normalizeCockpitConfig({
      categories: [{
        id: 'c',
        label: 'c',
        pages: [{
          id: 'p',
          title: 'p',
          left: { columns: [{ id: 'col', width: 1, containers: [{
            id: 'ct',
            height: 1,
            mode: 'tabs',
            activeWidgetId: 'ghost',
            widgets: [{ id: 'w1', type: 't', visible: true }],
          }] }] },
          right: { columns: [] },
        }],
      }],
    })
    expect(result.categories[0].pages[0].left.columns[0].containers[0].activeWidgetId).toBe('w1')
  })
})

describe('validateCockpitConfig', () => {
  it('重复 id 校验失败', () => {
    const result = validateCockpitConfig({
      schemaVersion: 1,
      id: 'x',
      title: 't',
      categories: [
        { id: 'dup', label: 'a', pages: [{ id: 'p1', title: 'p', left: { columns: [] }, right: { columns: [] } }] },
        { id: 'dup', label: 'b', pages: [{ id: 'p2', title: 'p', left: { columns: [] }, right: { columns: [] } }] },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.level === 'error')).toBe(true)
  })

  it('single 模式多可见模块报错', () => {
    const result = validateCockpitConfig({
      schemaVersion: 1,
      id: 'x',
      title: 't',
      categories: [{ id: 'c', label: 'c', pages: [{
        id: 'p',
        title: 'p',
        left: { columns: [{ id: 'col', width: 1, containers: [{
          id: 'ct',
          height: 1,
          mode: 'single',
          widgets: [{ id: 'w1', type: 't', visible: true }, { id: 'w2', type: 't', visible: true }],
        }] }] },
        right: { columns: [] },
      }] }],
    })
    expect(result.valid).toBe(false)
  })

  it('合法配置校验通过', () => {
    const result = validateCockpitConfig({
      schemaVersion: 1,
      id: 'x',
      title: 't',
      categories: [{ id: 'c', label: 'c', pages: [{ id: 'p', title: 'p', left: { columns: [] }, right: { columns: [] } }] }],
    })
    expect(result.valid).toBe(true)
  })
})

describe('migrateCockpitConfig', () => {
  it('未知版本补齐为当前 schemaVersion', () => {
    const result = migrateCockpitConfig({ title: 't' })
    expect(result.schemaVersion).toBe(COCKPIT_SCHEMA_VERSION)
  })

  it('needsMigration 判断版本差异', () => {
    expect(needsMigration({ schemaVersion: 0 })).toBe(true)
    expect(needsMigration({ schemaVersion: COCKPIT_SCHEMA_VERSION })).toBe(false)
  })
})
