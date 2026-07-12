import type { CockpitConfig } from '../src/types'
import { describe, expect, it } from 'vitest'
import { COCKPIT_SCHEMA_VERSION } from '../src/config/defaults'
import { useCockpitDraft } from '../src/designer/useCockpitDraft'

function sourceConfig(): CockpitConfig {
  return {
    schemaVersion: 1,
    id: 'ck',
    title: '原始',
    activeCategoryId: 'cat-1',
    categories: [{
      id: 'cat-1',
      label: '分类一',
      visible: true,
      activePageId: 'p1',
      pages: [{
        id: 'p1',
        title: '页面一',
        left: { columns: [{ id: 'col', width: 1, containers: [{ id: 'ct', height: 1, mode: 'single', widgets: [] }] }] },
        right: { columns: [] },
      }],
    }],
  }
}

describe('useCockpitDraft', () => {
  it('编辑草稿不污染原始配置', () => {
    const source = sourceConfig()
    const draft = useCockpitDraft(source)
    draft.renameCategory('cat-1', '改名了')
    expect(draft.draft.value.categories[0].label).toBe('改名了')
    // 原始对象不受影响
    expect(source.categories[0].label).toBe('分类一')
  })

  it('reset 恢复本次打开时的原始配置', () => {
    const draft = useCockpitDraft(sourceConfig())
    draft.addCategory()
    expect(draft.draft.value.categories).toHaveLength(2)
    draft.reset()
    expect(draft.draft.value.categories).toHaveLength(1)
  })

  it('新增页面与列容器模块', () => {
    const draft = useCockpitDraft(sourceConfig())
    draft.addColumn('left')
    draft.addPage()
    expect(draft.activeCategory.value?.pages).toHaveLength(2)
  })

  it('同 type 可添加多个实例且 id 唯一', () => {
    const draft = useCockpitDraft(sourceConfig())
    draft.addWidget('left', 'col', 'ct', 'stub', '模块')
    draft.setContainerMode('left', 'col', 'ct', 'combined')
    draft.addWidget('left', 'col', 'ct', 'stub', '模块')
    const widgets = draft.draft.value.categories[0].pages[0].left.columns[0].containers[0].widgets
    expect(widgets).toHaveLength(2)
    expect(widgets[0].id).not.toBe(widgets[1].id)
  })

  it('buildSaveConfig 对重复 id 校验失败', () => {
    const draft = useCockpitDraft(sourceConfig())
    // 制造重复分类 id
    draft.draft.value.categories.push({ ...draft.draft.value.categories[0] })
    const { validation } = draft.buildSaveConfig()
    expect(validation.valid).toBe(false)
  })

  it('buildSaveConfig 输出标准化的合法配置', () => {
    const draft = useCockpitDraft(sourceConfig())
    const { config, validation } = draft.buildSaveConfig()
    expect(validation.valid).toBe(true)
    expect(config.schemaVersion).toBe(COCKPIT_SCHEMA_VERSION)
    expect(() => JSON.stringify(config)).not.toThrow()
  })

  it('删除分类后选择相邻可用项', () => {
    const draft = useCockpitDraft(sourceConfig())
    draft.addCategory()
    const secondId = draft.draft.value.categories[1].id
    draft.selectCategory(secondId)
    draft.removeCategory(secondId)
    expect(draft.activeCategory.value?.id).toBe('cat-1')
  })
})
