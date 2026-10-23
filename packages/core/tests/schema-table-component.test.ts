import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { LumalSchemaTable } from '../src/components/schema-table'
import { createDictionaryStore, dictionaryContextKey } from '../src/dictionary'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('lumal schema table', () => {
  it('序号列支持分页、选中行导出及关闭分页，不读取或修改业务行', async () => {
    const rows = [{ id: 1, name: '甲' }, { id: 2, name: '乙' }]
    const wrapper = mount(LumalSchemaTable, {
      global: { stubs: elementPlusStubs },
      props: {
        columns: [{ type: 'index', label: '序号' }, { field: 'name', label: '名称' }],
        rows,
        pagination: true,
        page: 2,
        pageSize: 10,
        total: 30,
      },
    })
    const indexColumn = wrapper.findAllComponents({ name: 'ElTableColumn' })[0]!
    expect(indexColumn.props('prop')).toBeUndefined()
    expect(indexColumn.props('type')).toBe('index')
    expect(indexColumn.props('formatter')(rows[0], {}, undefined, 0)).toBe('11')
    const api = wrapper.vm as unknown as { getExportData: (sourceRows?: typeof rows) => { rows: string[][] } }
    expect(api.getExportData().rows).toEqual([['11', '甲'], ['12', '乙']])
    expect(api.getExportData([rows[1]!]).rows).toEqual([['12', '乙']])
    await wrapper.setProps({ pagination: false })
    expect(api.getExportData().rows).toEqual([['1', '甲'], ['2', '乙']])
    expect(rows[0]).toEqual({ id: 1, name: '甲' })
    wrapper.unmount()
  })

  it('会使用 Element Plus 表格组件渲染可见列，并保留 formatter', () => {
    const rows = [
      {
        id: 'row-1',
        name: 'Lumal',
        status: 'enabled',
        secret: '不可见',
      },
    ]

    const wrapper = mount(LumalSchemaTable, {
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
    const wrapper = mount(LumalSchemaTable, {
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

    const wrapper = mount(LumalSchemaTable, {
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

    const wrapper = mount(LumalSchemaTable, {
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

    const tags = wrapper.findAll('.lumal-schema-table__dictionary-tag')

    expect(tags.map(tag => tag.text())).toEqual(['启用', '停用'])
    expect(tags[0]?.attributes('style')).toContain('--lumal-dictionary-color: #16a34a')
    expect(wrapper.findAll('.lumal-schema-table__dictionary-dot')).toHaveLength(2)
  })

  it('dictType 会优先于手工 options 自动翻译并应用字典颜色', async () => {
    const rows = [{ id: 'row-1', priority: 1 }]
    const store = createDictionaryStore({
      fetcher: async () => ({
        items: [
          { color: '#ef4444', label: '高优先级', value: '1' },
          { color: '#64748b', label: '普通优先级', value: '0' },
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

    const wrapper = mount(LumalSchemaTable, {
      global: {
        provide: {
          [dictionaryContextKey as symbol]: { store },
        },
        stubs: {
          ...elementPlusStubs,
          ElTableColumn: TableColumnStub,
        },
      },
      props: {
        columns: [{
          dictType: 'priority',
          field: 'priority',
          label: '优先级',
          options: [{ label: '错误的手工标签', value: 1 }],
        }],
        rows,
      },
    })

    await Promise.resolve()
    await nextTick()

    expect(wrapper.find('.lumal-schema-table__dictionary-tag').text()).toBe('高优先级')
    expect(wrapper.find('.lumal-schema-table__dictionary-tag').attributes('style')).toContain(
      '--lumal-dictionary-color: #ef4444',
    )
  })

  it('会渲染选择列、序号列、分页、透传属性并转发交互事件', async () => {
    const rows = [
      { id: 'row-1', name: 'Lumal', status: 'enabled' },
      { id: 'row-2', name: 'Admin', status: 'disabled' },
    ]

    const wrapper = mount(LumalSchemaTable, {
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
    expect(columns.at(-1)?.props('width')).toBe(160)
    expect(wrapper.find('.row-action').exists()).toBe(true)
    const mobileActionTrigger = wrapper.find('.lumal-schema-table__mobile-actions')
    expect(mobileActionTrigger.element.tagName).toBe('BUTTON')
    expect(mobileActionTrigger.text()).toBe('更多')
    expect(mobileActionTrigger.attributes('aria-haspopup')).toBe('menu')
    expect(mobileActionTrigger.attributes('aria-expanded')).toBe('false')

    table.vm.$emit('selection-change', [rows[0]])
    await nextTick()
    expect(wrapper.emitted('selectionChange')?.at(-1)?.[0]).toEqual([rows[0]])
    expect(wrapper.emitted('selectionChange')?.at(-1)?.[1]).toEqual(['row-1'])

    await wrapper.find('[data-action="next"]').trigger('click')
    expect(wrapper.emitted('pageChange')?.at(-1)?.[0]).toEqual({
      page: 2,
      pageSize: 10,
    })
  })

  it('移动端使用受控 Popover 显示行操作，且在操作、外部点击和 Escape 后关闭', async () => {
    const originalWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 })
    const rows = [
      { id: 'row-1', name: 'Lumal' },
      { id: 'row-2', name: 'Admin' },
    ]
    const actionCalls: string[] = []
    const TableColumnStub = defineComponent({
      name: 'ElTableColumn',
      props: {
        fixed: [String, Boolean],
        label: String,
        prop: String,
        width: [String, Number],
      },
      setup(props, { slots }) {
        return () => h('section', {
          'class': 'el-table-column',
          'data-label': props.label,
          'data-width': props.width,
        }, props.label === '操作'
          ? rows.map((row, index) => h('div', { key: row.id }, slots.default?.({ $index: index, row })))
          : [])
      },
    })
    const wrapper = mount(LumalSchemaTable, {
      global: {
        stubs: {
          ...elementPlusStubs,
          ElTableColumn: TableColumnStub,
        },
      },
      props: {
        columns: [{ field: 'name', label: '名称' }],
        rowKey: 'id',
        rows,
      },
      slots: {
        actions: ({ row }) => h('button', {
          class: 'row-action',
          type: 'button',
          onClick: (event: MouseEvent) => {
            event.stopPropagation()
            actionCalls.push(String(row?.id))
          },
        }, `查看${String(row?.id)}`),
      },
    })

    try {
      await nextTick()
      const actionColumn = wrapper.findAllComponents({ name: 'ElTableColumn' })
        .find(column => column.props('label') === '操作')
      const popovers = wrapper.findAllComponents({ name: 'ElPopover' })
      const triggers = wrapper.findAll('.lumal-schema-table__mobile-actions')

      expect(actionColumn?.props('width')).toBe(72)
      expect(popovers).toHaveLength(2)
      expect(popovers[0]?.props()).toMatchObject({
        placement: 'bottom-end',
        teleported: true,
        trigger: 'click',
        visible: false,
      })

      await wrapper.setProps({ mobileActionWidth: 84 })
      expect(actionColumn?.props('width')).toBe(84)

      await triggers[0]?.trigger('click')
      await nextTick()
      expect(triggers[0]?.attributes('aria-expanded')).toBe('true')
      expect(triggers[1]?.attributes('aria-expanded')).toBe('false')

      await triggers[1]?.trigger('click')
      await nextTick()
      expect(triggers[0]?.attributes('aria-expanded')).toBe('false')
      expect(triggers[1]?.attributes('aria-expanded')).toBe('true')

      await wrapper.find('.lumal-schema-table__mobile-actions-menu .row-action').trigger('click')
      await nextTick()
      expect(actionCalls).toEqual(['row-2'])
      expect(triggers[1]?.attributes('aria-expanded')).toBe('false')

      await triggers[0]?.trigger('click')
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(triggers[0]?.attributes('aria-expanded')).toBe('false')

      await triggers[0]?.trigger('click')
      document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
      await nextTick()
      expect(triggers[0]?.attributes('aria-expanded')).toBe('false')

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 769 })
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(actionColumn?.props('width')).toBe(160)
    }
    finally {
      wrapper.unmount()
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
    }
  })

  it('支持字段插槽、行级隐藏、列设置和树表属性', async () => {
    const rows = [{ children: [], id: 'row-1', name: 'Lumal', secret: true, status: 'enabled' }]
    const TableColumnStub = defineComponent({
      name: 'ElTableColumn',
      setup(_props, { slots }) {
        return () => h('div', { class: 'el-table-column' }, slots.default?.({
          $index: 0,
          row: rows[0],
        }))
      },
    })
    const wrapper = mount(LumalSchemaTable, {
      global: {
        stubs: {
          ...elementPlusStubs,
          ElTableColumn: TableColumnStub,
        },
      },
      props: {
        columns: [
          {
            field: 'name',
            hidden: ({ row }) => Boolean(row?.secret),
            label: '名称',
          },
          {
            field: 'status',
            label: '状态',
          },
        ],
        defaultExpandAll: true,
        rowKey: 'id',
        rows,
        showColumnSettings: true,
        treeProps: { children: 'children' },
      },
      slots: {
        'table-name': () => h('strong', { class: 'hidden-row-cell' }, '不应显示'),
        'table-status': ({ value }) => h('strong', { class: 'custom-table-cell' }, String(value)),
      },
    })

    expect(wrapper.find('.hidden-row-cell').exists()).toBe(false)
    expect(wrapper.find('.custom-table-cell').text()).toBe('enabled')
    expect(wrapper.find('.lumal-schema-table__column-settings').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElTable' }).props('defaultExpandAll')).toBe(true)
    expect(wrapper.findComponent({ name: 'ElTable' }).props('treeProps')).toEqual({ children: 'children' })

    await wrapper.findAll('.lumal-schema-table__column-options input')[1]?.setValue(false)
    expect(wrapper.find('.custom-table-cell').exists()).toBe(false)
  })

  it('工具栏插槽与列设置共享同一工具栏层级', () => {
    const wrapper = mount(LumalSchemaTable, {
      global: { stubs: elementPlusStubs },
      props: {
        columns: [{ field: 'name', label: '名称' }],
        rows: [],
        showColumnSettings: true,
      },
      slots: {
        'toolbar': () => h('button', { class: 'custom-toolbar-action', type: 'button' }, '新增'),
        'toolbar-tools': () => h('button', { class: 'custom-toolbar-tool', type: 'button' }, '刷新'),
      },
    })

    const toolbar = wrapper.find('.lumal-schema-table__toolbar')
    expect(toolbar.find('.custom-toolbar-action').exists()).toBe(true)
    const tools = toolbar.find('.lumal-schema-table__toolbar-tools')
    expect(tools.find('.custom-toolbar-tool').exists()).toBe(true)
    expect(tools.find('[aria-label="列设置"]').exists()).toBe(true)
  })

  it('列设置支持持久化顺序、隐藏和恢复默认', async () => {
    localStorage.setItem('schema-table-columns', JSON.stringify({
      hidden: ['status'],
      order: ['status', 'name'],
    }))
    const wrapper = mount(LumalSchemaTable, {
      global: { stubs: elementPlusStubs },
      props: {
        columnSettings: {
          enabled: true,
          reorderable: true,
          storageKey: 'schema-table-columns',
        },
        columns: [
          { field: 'name', label: '名称' },
          { field: 'status', label: '状态' },
        ],
        rows: [{ id: 'row-1', name: 'Lumal', status: 'enabled' }],
      },
    })

    await nextTick()
    expect(wrapper.findAllComponents({ name: 'ElTableColumn' }).map(item => item.props('prop'))).toEqual(['name'])
    expect(wrapper.get('[aria-label="上移状态"] .lumal-icon').find('svg').exists()).toBe(true)
    expect(wrapper.get('[aria-label="下移状态"] .lumal-icon').find('svg').exists()).toBe(true)

    await wrapper.find('.lumal-schema-table__column-options-header button').trigger('click')
    await nextTick()
    expect(wrapper.findAllComponents({ name: 'ElTableColumn' }).map(item => item.props('prop'))).toEqual(['name', 'status'])
    expect(JSON.parse(localStorage.getItem('schema-table-columns') ?? '{}')).toEqual({
      hidden: [],
      order: ['name', 'status'],
    })
  })

  it('会转发排序、筛选、行点击、当前行、展开和重试事件', async () => {
    const row = { id: 'row-1', name: 'Lumal' }
    const wrapper = mount(LumalSchemaTable, {
      global: { stubs: elementPlusStubs },
      props: {
        columns: [{ field: 'name', label: '名称' }],
        rows: [row],
      },
    })
    const table = wrapper.findComponent({ name: 'ElTable' })
    const event = new MouseEvent('click')
    table.vm.$emit('sort-change', { order: 'ascending', prop: 'name' })
    table.vm.$emit('filter-change', { status: ['enabled'] })
    table.vm.$emit('row-click', row, { property: 'name' }, event)
    table.vm.$emit('current-change', row, undefined)
    table.vm.$emit('expand-change', row, true)
    await nextTick()

    expect(wrapper.emitted('sortChange')?.[0]?.[0]).toMatchObject({ order: 'ascending', prop: 'name' })
    expect(wrapper.emitted('filterChange')?.[0]?.[0]).toEqual({ status: ['enabled'] })
    expect(wrapper.emitted('rowClick')?.[0]).toEqual([row, { property: 'name' }, event])
    expect(wrapper.emitted('currentChange')?.[0]).toEqual([row, undefined])
    expect(wrapper.emitted('expandChange')?.[0]).toEqual([row, true])

    await wrapper.setProps({ error: new Error('加载失败') })
    await wrapper.find('.lumal-schema-table__error button').trigger('click')
    expect(wrapper.find('.lumal-schema-table__error').text()).toContain('加载失败')
    expect(wrapper.emitted('retry')).toHaveLength(1)

    await wrapper.setProps({ error: '' })
    expect(wrapper.find('.lumal-schema-table__error').exists()).toBe(false)
  })
})
