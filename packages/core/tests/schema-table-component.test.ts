import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumaSchemaTable } from '../src/components/schema-table'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('luma schema table', () => {
  it('会使用 Element Plus 表格组件渲染可见列，并保留 formatter', () => {
    const rows = [
      {
        id: 'row-1',
        name: 'Luma',
        status: 'enabled',
        secret: '不可见',
      },
    ]

    const wrapper = mount(LumaSchemaTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        rowKey: 'id',
        columns: [
          {
            field: 'name',
            label: '名称',
          },
          {
            field: 'status',
            label: '状态',
            formatter: value => value === 'enabled' ? '启用' : '停用',
          },
          {
            field: 'secret',
            label: '隐藏字段',
            hidden: true,
          },
        ],
        rows,
      },
    })

    const table = wrapper.findComponent({ name: 'ElTable' })
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const statusFormatter = columns[1]?.props('formatter') as
      | ((row: Record<string, unknown>, column: unknown, value: unknown, index: number) => unknown)
      | undefined

    expect(table.exists()).toBe(true)
    expect(table.props('data')).toEqual(rows)
    expect(columns.map(item => item.props('label'))).toEqual(['名称', '状态'])
    expect(columns.map(item => item.props('prop'))).toEqual(['name', 'status'])
    expect(statusFormatter?.(rows[0], {}, 'enabled', 0)).toBe('启用')
    expect(columns.map(item => item.props('prop'))).not.toContain('secret')
  })

  it('没有数据时会把空状态文案交给 Element Plus 表格', () => {
    const wrapper = mount(LumaSchemaTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        emptyText: '暂无项目',
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
      },
    })

    expect(wrapper.findComponent({ name: 'ElTable' }).props('emptyText')).toBe('暂无项目')
  })
})
