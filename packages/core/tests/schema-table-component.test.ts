import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { LumaSchemaTable } from '../src/components/schema-table'
import { createDictionaryStore, dictionaryContextKey } from '../src/dictionary'
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

  it('会使用 dictionary 字段把表格值回显为 label', async () => {
    const rows = [
      {
        id: 'row-1',
        status: ['enabled', 'disabled'],
      },
    ]
    const store = createDictionaryStore({
      fetcher: async () => ({
        items: [
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ],
      }),
    })

    const wrapper = mount(LumaSchemaTable, {
      global: {
        provide: {
          [dictionaryContextKey as symbol]: {
            store,
          },
        },
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            dictionary: 'status',
            field: 'status',
            label: '状态',
          },
        ],
        rowKey: 'id',
        rows,
      },
    })

    await Promise.resolve()
    await wrapper.vm.$nextTick()

    const formatter = wrapper.findComponent({ name: 'ElTableColumn' }).props('formatter') as
      | ((row: Record<string, unknown>, column: unknown, value: unknown, index: number) => unknown)
      | undefined

    expect(formatter?.(rows[0], {}, ['enabled', 'disabled'], 0)).toBe('启用, 停用')
  })

  it('字典项包含颜色时会渲染带文本的颜色标签', async () => {
    const rows = [
      {
        id: 'row-1',
        status: ['enabled', 'disabled'],
      },
    ]
    const store = createDictionaryStore({
      fetcher: async () => ({
        items: [
          { color: '#16a34a', label: '启用', value: 'enabled' },
          { color: '#94a3b8', label: '停用', value: 'disabled' },
        ],
      }),
    })
    const TableColumnStub = defineComponent({
      name: 'ElTableColumn',
      setup(_props, { slots }) {
        return () => h('div', { class: 'el-table-column' }, slots.default?.({
          $index: 0,
          row: rows[0],
        }))
      },
    })
    const TagStub = defineComponent({
      name: 'ElTag',
      template: '<span class="el-tag"><slot /></span>',
    })

    const wrapper = mount(LumaSchemaTable, {
      global: {
        provide: {
          [dictionaryContextKey as symbol]: {
            store,
          },
        },
        stubs: {
          ...elementPlusStubs,
          ElTableColumn: TableColumnStub,
          ElTag: TagStub,
        },
      },
      props: {
        columns: [
          {
            dictionary: 'status',
            field: 'status',
            label: '状态',
          },
        ],
        rowKey: 'id',
        rows,
      },
    })

    await Promise.resolve()
    await wrapper.vm.$nextTick()

    const tags = wrapper.findAll('.luma-schema-table__dictionary-tag')

    expect(tags.map(tag => tag.text())).toEqual(['启用', '停用'])
    expect(tags[0]?.attributes('style')).toContain('--luma-dictionary-color: #16a34a')
    expect(wrapper.findAll('.luma-schema-table__dictionary-dot')).toHaveLength(2)
  })

  it('会渲染选择列、序号列、分页、透传属性并转发交互事件', async () => {
    const rows = [
      { id: 'row-1', name: 'Luma', status: 'enabled' },
      { id: 'row-2', name: 'Admin', status: 'disabled' },
    ]

    const wrapper = mount(LumaSchemaTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        cellClassName: 'cell-class',
        columns: [
          {
            componentProps: {
              minWidth: 160,
            },
            field: 'name',
            label: '名称',
          },
          {
            authority: 'status:view',
            field: 'status',
            label: '状态',
          },
        ],
        headerCellClassName: 'header-class',
        loading: true,
        page: 1,
        pageSize: 10,
        pageSizes: [10, 20],
        pagination: true,
        rowClassName: 'row-class',
        rows,
        selection: true,
        showIndex: true,
        tableProps: {
          border: true,
          stripe: true,
        },
        total: 32,
      },
      slots: {
        actions: ({ row }) => h('button', { class: 'row-action', type: 'button' }, String(row?.id ?? '操作')),
      },
    })

    const table = wrapper.findComponent({ name: 'ElTable' })
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })

    expect(table.attributes('data-loading')).toBe('true')
    expect(table.props('border')).toBe(true)
    expect(table.props('stripe')).toBe(true)
    expect(table.props('rowClassName')).toBe('row-class')
    expect(table.props('cellClassName')).toBe('cell-class')
    expect(table.props('headerCellClassName')).toBe('header-class')
    expect(columns.map(item => item.props('type'))).toEqual(['selection', 'index', undefined, undefined, undefined])
    expect(columns[2]?.props('minWidth')).toBe(160)
    expect(wrapper.find('.row-action').exists()).toBe(true)

    table.vm.$emit('selection-change', [rows[0]])
    await nextTick()
    expect(wrapper.emitted('selectionChange')?.at(-1)?.[0]).toEqual([rows[0]])

    await wrapper.find('[data-action="next"]').trigger('click')
    expect(wrapper.emitted('pageChange')?.at(-1)?.[0]).toEqual({
      page: 2,
      pageSize: 10,
    })
  })
})
