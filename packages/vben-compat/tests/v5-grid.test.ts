import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useVbenVxeGrid } from '../src/v5'

describe('vben 5 Grid 行为契约', () => {
  it('组件不静默忽略 gridOptions props', () => {
    const [Grid] = useVbenVxeGrid()
    expect(() => mount(Grid, { attrs: { gridOptions: {} } })).toThrow('api.setState')
  })

  it('顶层 formOptions、分页对象、查询值、刷新、列配置及选择 API', async () => {
    const query = vi.fn(async ({ page }: { page: { currentPage: number, pageSize: number } }, values) => ({
      data: { records: [{ id: String(page.currentPage), name: String(values.keyword ?? 'row') }], count: 25 },
    }))
    const [Grid, api] = useVbenVxeGrid({
      formOptions: { schema: [{ fieldName: 'keyword', component: 'Input', label: '关键词' }] },
      gridOptions: {
        columns: [{ type: 'checkbox' }, { type: 'seq', title: '序号' }, { field: 'name', title: '名称', sortable: true }, { field: 'id', title: '操作', slots: { default: 'action' } }],
        rowConfig: { keyField: 'id' },
        proxyConfig: { response: { result: 'data.records', total: 'data.count' }, ajax: { query } },
        toolbarConfig: { custom: true, search: true, refresh: true },
      },
    })
    const wrapper = mount(Grid, { attachTo: document.body, slots: { action: ({ row }: { row: { id: string } }) => h('button', `操作${row.id}`) } })
    await flushPromises()
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ page: { currentPage: 1, pageSize: 10 } }), expect.any(Object))
    await wrapper.get('input[name="keyword"]').setValue('searched')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(query).toHaveBeenLastCalledWith(expect.any(Object), expect.objectContaining({ keyword: 'searched' }))
    expect(wrapper.text()).toContain('searched')
    expect(wrapper.text()).toContain('操作1')
    await wrapper.get('.sort-caret.ascending').trigger('click')
    await flushPromises()
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ sort: { field: 'name', order: 'asc' } }), expect.any(Object))
    await wrapper.get('.btn-next').trigger('click')
    await flushPromises()
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ page: { currentPage: 2, pageSize: 10 } }), expect.any(Object))
    await api.reload()
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ page: { currentPage: 1, pageSize: 10 } }), expect.any(Object))
    const rows = api.grid.getTableData().tableData
    api.grid.setCheckboxRow(rows, true)
    await flushPromises()
    expect(api.grid.getCheckboxRecords()).toHaveLength(1)
    api.grid.clearCheckboxRow()
    await flushPromises()
    expect(api.grid.getCheckboxRecords()).toEqual([])
    expect(api.toggleSearchForm(false)).toBe(false)
    await flushPromises()
    expect(wrapper.get('.lumal-v5-grid__form').attributes('style')).toContain('display: none')
    api.setGridOptions({ columns: [{ field: 'name', title: '新标题' }] })
    await flushPromises()
    expect(wrapper.text()).toContain('新标题')
    wrapper.unmount()
  })

  it('动态更新查询 schema 保留原有提交回调', async () => {
    const submit = vi.fn()
    const [Grid, api] = useVbenVxeGrid({
      formOptions: { schema: [{ component: 'Input', fieldName: 'keyword', label: '关键词' }], handleSubmit: submit },
    })
    const wrapper = mount(Grid)
    api.setState({ formOptions: { schema: [{ component: 'Input', fieldName: 'name', label: '名称' }] } })
    await flushPromises()
    await wrapper.get('input[name="name"]').setValue('updated')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'updated' }))
    wrapper.unmount()
  })

  it('查询失败传播并保留旧行，界面重试恢复', async () => {
    let fail = false
    const query = vi.fn(async () => {
      if (fail)
        throw new Error('网络暂不可用')
      return { items: [{ id: '1', name: '保留数据' }], total: 1 }
    })
    const [Grid, api] = useVbenVxeGrid({ gridOptions: { columns: [{ field: 'name', title: '名称' }], proxyConfig: { ajax: { query } } } })
    const wrapper = mount(Grid)
    await flushPromises()
    fail = true
    await expect(api.query()).rejects.toThrow('网络暂不可用')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('网络暂不可用')
    expect(wrapper.text()).toContain('保留数据')
    fail = false
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(api.error.value).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('卸载使在途查询失效并清理实例', async () => {
    let resolve!: (value: unknown) => void
    let api!: ReturnType<typeof useVbenVxeGrid>[1]
    const wrapper = mount(defineComponent({
      setup() {
        const [Grid, gridApi] = useVbenVxeGrid({ gridOptions: { proxyConfig: { autoLoad: false, ajax: { query: () => new Promise((done) => {
          resolve = done
        }) } } } })
        api = gridApi
        return () => h(Grid)
      },
    }))
    const pending = api.query()
    await flushPromises()
    wrapper.unmount()
    resolve({ items: [{ id: 'old' }], total: 1 })
    await pending
    expect(api.grid.getTableData().tableData).toEqual([])
    expect(api.grid.getCheckboxRecords()).toEqual([])
    await expect(api.query()).rejects.toThrow('卸载')
  })

  it('拒绝 VXE 引擎配置而不是默默忽略', () => {
    // @ts-expect-error 高级编辑不属于轻量兼容范围
    expect(() => useVbenVxeGrid({ gridOptions: { editConfig: {} } })).toThrow('editConfig')
  })
})
