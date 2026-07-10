import { describe, expect, it } from 'vitest'
import { normalizeSchemaTableColumns } from '../src/components/schema-table'

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
      renderable: false,
    })
    expect(columns[1]?.renderable).toBe(false)
  })
})
