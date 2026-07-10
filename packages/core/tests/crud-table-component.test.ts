import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { LumaCrudTable } from '../src/components/crud-table'
import { LumaPagination } from '../src/components/pagination'
import { LumaSchemaForm } from '../src/components/schema-form'
import { LumaSchemaTable } from '../src/components/schema-table'
import { createDictionaryStore, dictionaryContextKey } from '../src/dictionary'
import { elementPlusStubs } from './helpers/element-plus-stubs'

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

describe('luma crud table', () => {
  it('会组合查询表单、表格、分页和 Element Plus 操作按钮', () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        title: '项目列表',
        querySchemas: [
          {
            field: 'keyword',
            label: '关键词',
            component: 'input',
          },
        ],
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [
          {
            id: 'row-1',
            name: 'Luma',
          },
        ],
        rowKey: 'id',
        total: 1,
      },
    })

    expect(wrapper.find('.luma-page__title').text()).toBe('项目列表')
    expect(wrapper.find('.luma-crud-table__query').exists()).toBe(true)
    expect(wrapper.findComponent(LumaSchemaForm).exists()).toBe(true)
    expect(wrapper.findComponent(LumaSchemaTable).exists()).toBe(true)
    expect(wrapper.findComponent(LumaPagination).exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'ElButton' })).toHaveLength(2)
  })

  it('允许应用通过 create-action 插槽替换默认新增按钮', async () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        formSchemas: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
      },
      slots: {
        'create-action': (slotProps: { openCreate: () => void }) => h('button', {
          class: 'custom-create',
          onClick: slotProps.openCreate,
        }, '新增用户'),
      },
    })

    expect(wrapper.find('[data-action="create"]').exists()).toBe(false)
    expect(wrapper.find('.custom-create').text()).toBe('新增用户')

    await wrapper.find('.custom-create').trigger('click')

    expect(wrapper.find('.el-dialog').attributes('data-title')).toBe('新增')
  })

  it('点击搜索会触发 search 并携带查询模型', async () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        queryModel: {
          keyword: 'Luma',
        },
        querySchemas: [
          {
            field: 'keyword',
            label: '关键词',
            component: 'input',
          },
        ],
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
      },
    })

    await wrapper.find('[data-action="search"]').trigger('click')

    expect(wrapper.emitted('search')?.[0]).toEqual([
      {
        keyword: 'Luma',
      },
    ])
  })

  it('点击重置会恢复查询默认值并触发 reset', async () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        queryModel: {
          keyword: '旧值',
        },
        querySchemas: [
          {
            field: 'keyword',
            label: '关键词',
            component: 'input',
            defaultValue: '默认值',
          },
        ],
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
      },
    })

    await wrapper.find('[data-action="reset"]').trigger('click')

    expect(wrapper.emitted('update:queryModel')?.[0]).toEqual([
      {
        keyword: '默认值',
      },
    ])
    expect(wrapper.emitted('reset')?.[0]).toEqual([
      {
        keyword: '默认值',
      },
    ])
  })

  it('分页变化会透传 page-change', async () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
        page: 1,
        pageSize: 10,
        total: 35,
      },
    })

    await wrapper.find('[data-action="next"]').trigger('click')

    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([
      {
        page: 2,
        pageSize: 10,
      },
    ])
  })

  it('会渲染默认插槽作为表格扩展内容', () => {
    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rows: [],
      },
      slots: {
        default: '<span class="extra-message">当前展示示例数据</span>',
      },
    })

    expect(wrapper.find('.luma-crud-table__extra').text()).toBe('当前展示示例数据')
  })

  it('查询表单和表格列会复用 dictionary 字典能力', async () => {
    const rows = [
      {
        id: 'row-1',
        status: 'enabled',
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

    const wrapper = mount(LumaCrudTable, {
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
        querySchemas: [
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

    expect(wrapper.findAllComponents({ name: 'ElOption' }).map(item => item.props('label'))).toEqual(['启用', '停用'])

    const formatter = wrapper.findComponent({ name: 'ElTableColumn' }).props('formatter') as
      | ((row: Record<string, unknown>, column: unknown, value: unknown, index: number) => unknown)
      | undefined

    expect(formatter?.(rows[0], {}, 'enabled', 0)).toBe('启用')
  })

  it('会通过标准 dataSource 加载数据并随查询分页刷新', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({
        items: [{ id: 'row-1', name: 'Luma' }],
        total: 21,
      })
      .mockResolvedValueOnce({
        items: [{ id: 'row-2', name: 'Admin' }],
        total: 21,
      })

    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        dataSource: {
          fetch,
        },
        queryModel: {
          keyword: 'Luma',
        },
        querySchemas: [
          {
            field: 'keyword',
            label: '关键词',
          },
        ],
      },
    })

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      query: {
        keyword: 'Luma',
      },
    })
    expect(wrapper.findComponent(LumaSchemaTable).props('rows')).toEqual([{ id: 'row-1', name: 'Luma' }])
    expect(wrapper.findComponent(LumaPagination).props('total')).toBe(21)

    await wrapper.find('[data-action="next"]').trigger('click')
    await flushPromises()

    expect(fetch).toHaveBeenLastCalledWith({
      page: 2,
      pageSize: 10,
      query: {
        keyword: 'Luma',
      },
    })
    expect(wrapper.findComponent(LumaSchemaTable).props('rows')).toEqual([{ id: 'row-2', name: 'Admin' }])
  })

  it('会通过 dataSource 执行新增、编辑、删除和批量删除', async () => {
    const row = { id: 'row-1', name: '旧名称' }
    const dataSource = {
      create: vi.fn().mockResolvedValue({}),
      fetch: vi.fn().mockResolvedValue({
        items: [row],
        total: 1,
      }),
      remove: vi.fn().mockResolvedValue({}),
      removeMany: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    }

    const wrapper = mount(LumaCrudTable, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        dataSource,
        formSchemas: [
          {
            field: 'name',
            label: '名称',
          },
        ],
        rowKey: 'id',
        selection: true,
      },
    })

    await flushPromises()

    const api = wrapper.vm as unknown as {
      openCreate: () => void
      openEdit: (row: Record<string, unknown>) => void
      removeRow: (row: Record<string, unknown>) => Promise<void>
    }

    api.openCreate()
    await nextTick()
    wrapper.findAllComponents(LumaSchemaForm).at(-1)?.vm.$emit('submit', { name: '新名称' })
    await flushPromises()
    expect(dataSource.create).toHaveBeenCalledWith({ name: '新名称' })

    api.openEdit(row)
    await nextTick()
    wrapper.findAllComponents(LumaSchemaForm).at(-1)?.vm.$emit('submit', { name: '修改后' })
    await flushPromises()
    expect(dataSource.update).toHaveBeenCalledWith(row, { name: '修改后' })

    await api.removeRow(row)
    expect(dataSource.remove).toHaveBeenCalledWith(row)

    wrapper.findComponent(LumaSchemaTable).vm.$emit('selectionChange', [row])
    await nextTick()
    await wrapper.find('[data-action="batch-remove"]').trigger('click')
    await flushPromises()
    expect(dataSource.removeMany).toHaveBeenCalledWith([row])
  })
})
