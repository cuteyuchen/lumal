import { describe, expect, it } from 'vitest'
import {
  normalizeSchemaTableColumns,
  resolveSchemaTableCellDisplay,
} from '../src/components/schema-table'

describe('schema table normalize', () => {
  it('会过滤空字段，并标记隐藏列不可渲染', () => {
    const columns = normalizeSchemaTableColumns([
      {
        field: '',
        label: '空字段',
      },
      {
        field: 'name',
        label: '名称',
      },
      {
        field: 'secret',
        label: '隐藏字段',
        hidden: true,
      },
    ])

    expect(columns).toHaveLength(2)
    expect(columns[0]?.field).toBe('name')
    expect(columns[0]?.renderable).toBe(true)
    expect(columns[1]?.field).toBe('secret')
    expect(columns[1]?.renderable).toBe(false)
  })

  it('会补齐默认对齐方式和空值占位', () => {
    const columns = normalizeSchemaTableColumns([
      {
        field: 'status',
        label: '状态',
      },
    ])

    expect(columns[0]?.align).toBe('left')
    expect(columns[0]?.emptyText).toBe('-')
  })

  it('会按权限和状态函数归一化列配置', () => {
    const columns = normalizeSchemaTableColumns([
      {
        authority: 'project:read',
        componentProps: {
          minWidth: 160,
        },
        field: 'name',
        hidden: context => context.rows.length === 0,
        label: '名称',
      },
      {
        authority: 'project:secret',
        field: 'secret',
        label: '密级',
      },
    ], {
      canAccess: authority => authority !== 'project:secret',
      rows: [],
    })

    expect(columns[0]).toMatchObject({
      componentProps: {
        minWidth: 160,
      },
      renderable: true,
    })
    expect(columns[1]?.renderable).toBe(false)
  })

  it('会按 formatter、字典和数组顺序解析单元格显示', () => {
    const [dictionaryColumn, formatterColumn, arrayColumn] = normalizeSchemaTableColumns([
      {
        dictionary: 'status',
        field: 'status',
        label: '状态',
      },
      {
        field: 'score',
        formatter: value => `${String(value)} 分`,
        label: '评分',
      },
      {
        field: 'tags',
        label: '标签',
      },
    ])
    const row = {
      score: 90,
      status: ['enabled', 'disabled'],
      tags: ['表单', '表格'],
    }

    expect(resolveSchemaTableCellDisplay(row, dictionaryColumn!, 0, [
      { color: '#16a34a', label: '启用', value: 'enabled' },
      { color: '#94a3b8', label: '停用', value: 'disabled' },
    ])).toEqual({
      tags: [
        { color: '#16a34a', key: 'enabled-0', label: '启用' },
        { color: '#94a3b8', key: 'disabled-1', label: '停用' },
      ],
      text: '启用, 停用',
    })
    expect(resolveSchemaTableCellDisplay(row, formatterColumn!, 0)).toEqual({
      tags: [],
      text: '90 分',
    })
    expect(resolveSchemaTableCellDisplay(row, arrayColumn!, 0)).toEqual({
      tags: [],
      text: '表单, 表格',
    })
  })

  it('无颜色字典使用普通文本，空值使用列级占位文本', () => {
    const [statusColumn, tagsColumn] = normalizeSchemaTableColumns([
      {
        dictionary: 'status',
        emptyText: '未设置',
        field: 'status',
        label: '状态',
      },
      {
        emptyText: '暂无标签',
        field: 'tags',
        label: '标签',
      },
    ])

    expect(resolveSchemaTableCellDisplay(
      { status: 'enabled' },
      statusColumn!,
      0,
      [{ label: '启用', value: 'enabled' }],
    )).toEqual({
      tags: [],
      text: '启用',
    })
    expect(resolveSchemaTableCellDisplay({ status: null }, statusColumn!, 0)).toEqual({
      tags: [],
      text: '未设置',
    })
    expect(resolveSchemaTableCellDisplay({ tags: [] }, tagsColumn!, 0)).toEqual({
      tags: [],
      text: '暂无标签',
    })
  })

  it('部分字典项有颜色时仍保留全部标签文字', () => {
    const [column] = normalizeSchemaTableColumns([
      {
        dictionary: 'status',
        field: 'status',
        label: '状态',
      },
    ])

    expect(resolveSchemaTableCellDisplay(
      { status: ['enabled', 'disabled'] },
      column!,
      0,
      [
        { color: '#16a34a', label: '启用', value: 'enabled' },
        { label: '停用', value: 'disabled' },
      ],
    )).toEqual({
      tags: [
        { color: '#16a34a', key: 'enabled-0', label: '启用' },
        { key: 'disabled-1', label: '停用' },
      ],
      text: '启用, 停用',
    })
  })
})
