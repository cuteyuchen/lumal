import type { VbenFormProps } from '../src/v5'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useVbenForm } from '../src/v5'

describe('vben 5 Form 行为契约', () => {
  it('组件不静默忽略配置 props，提示通过 hook 或 setState 更新', () => {
    const [Form] = useVbenForm()
    expect(() => mount(Form, { attrs: { schema: [] } })).toThrow('api.setState')
  })

  it('返回组件、渲染真实控件、校验、回写值和重置', async () => {
    const submit = vi.fn()
    const [Form, api] = useVbenForm({
      schema: [
        { component: 'Input', fieldName: 'name', label: '姓名', rules: 'required' },
        { component: 'Select', fieldName: 'role', label: '角色', defaultValue: 'guest', componentProps: { options: [{ label: '访客', value: 'guest' }] } },
        { component: 'DatePicker', fieldName: 'date', label: '日期' },
        { component: 'InputPassword', fieldName: 'password', label: '密码' },
      ],
      handleSubmit: submit,
    })
    expect(typeof Form).toBe('object')
    const wrapper = mount(Form, { attachTo: document.body })
    expect(api.isMounted).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('.el-select').exists()).toBe(true)
    expect(wrapper.find('.el-date-editor').exists()).toBe(true)
    expect(await api.validate()).toMatchObject({ valid: false, errors: { name: '姓名不能为空' } })
    await wrapper.get('input[name="name"]').setValue('Lumal')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lumal', role: 'guest' }))
    expect(await api.getValues()).toMatchObject({ name: 'Lumal', role: 'guest' })
    await api.setValues({ name: 'changed', unknown: 'filtered' })
    expect((await api.getValues()).unknown).toBeUndefined()
    await api.resetForm()
    expect(await api.getValues()).toMatchObject({ name: undefined, role: 'guest' })
    wrapper.unmount()
    expect(api.isMounted).toBe(false)
    await expect(api.validate()).rejects.toThrow('挂载')
  })

  it('动态 if/show/disabled/required/选项分别具有实际行为', async () => {
    const [Form, api] = useVbenForm({
      schema: [
        { component: 'Switch', fieldName: 'enabled', label: '开启', defaultValue: true },
        { component: 'Input', fieldName: 'conditional', label: '条件', dependencies: { triggerFields: ['enabled'], if: values => Boolean(values.enabled), required: true } },
        { component: 'Input', fieldName: 'css', label: '隐藏', defaultValue: 'keep', dependencies: { triggerFields: ['enabled'], show: values => Boolean(values.enabled) } },
        { component: 'Input', fieldName: 'disabled', label: '禁用', dependencies: { triggerFields: ['enabled'], disabled: values => Boolean(values.enabled) } },
        { component: 'Select', fieldName: 'select', label: '动态选项', dependencies: { triggerFields: ['enabled'], componentProps: values => ({ options: [{ label: '动态', value: values.enabled ? 'on' : 'off' }] }) } },
      ],
    })
    const wrapper = mount(Form)
    expect(wrapper.get('input[name="disabled"]').attributes('disabled')).toBeDefined()
    expect((await api.validate()).valid).toBe(false)
    await api.setValues({ enabled: false })
    expect(wrapper.find('[data-field="conditional"]').exists()).toBe(false)
    expect(wrapper.get('[data-field="css"]').element.closest('.el-col')?.getAttribute('style')).toContain('display: none')
    expect((await api.getValues()).css).toBe('keep')
    expect((await api.validate()).valid).toBe(true)
    expect(wrapper.get('input[name="disabled"]').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('仅禁用提交按钮时字段仍可编辑，且 Enter 不提交', async () => {
    const submit = vi.fn()
    const [Form] = useVbenForm({
      schema: [{ component: 'Input', fieldName: 'name', label: '名称' }],
      submitButtonOptions: { disabled: true },
      handleSubmit: submit,
    })
    const wrapper = mount(Form)
    expect(wrapper.get('input[name="name"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('input[name="name"]').setValue('editable')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(submit).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('支持异步校验器、动态 schema、字段插槽和提交失败恢复', async () => {
    let fail = true
    const [Form, api] = useVbenForm({
      schema: [{
        component: 'Input',
        fieldName: 'name',
        label: '名称',
        rules: { safeParseAsync: async value => ({ success: value === 'ok', error: { issues: [{ message: '请输入 ok' }] } }) },
      }],
      handleSubmit() {
        if (fail)
          throw new Error('保存失败')
      },
    })
    const wrapper = mount(Form, { slots: { name: ({ modelValue, 'onUpdate:modelValue': update }: Record<string, unknown>) => h('input', { 'aria-label': '自定义', 'value': modelValue, 'onInput': (event: Event) => (update as (value: string) => void)((event.target as HTMLInputElement).value) }) } })
    expect(await api.validate()).toMatchObject({ valid: false, errors: { name: '请输入 ok' } })
    await wrapper.get('input[aria-label="自定义"]').setValue('ok')
    await expect(api.validateAndSubmitForm()).rejects.toThrow('保存失败')
    expect(wrapper.get('[role="alert"]').text()).toBe('保存失败')
    fail = false
    await expect(api.validateAndSubmitForm()).resolves.toMatchObject({ name: 'ok' })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    api.updateSchema([{ fieldName: 'name', label: '新名称' }])
    api.setState(previous => ({ schema: [...previous.schema!, { component: 'Input', fieldName: 'extra', label: '附加', defaultValue: 'new' }] }))
    await flushPromises()
    expect(wrapper.text()).toContain('新名称')
    expect((await api.getValues()).extra).toBe('new')
    await api.removeSchemaByFields(['extra'])
    expect((await api.getValues()).extra).toBeUndefined()
    wrapper.unmount()
  })

  it('提交单飞、加载状态及卸载期间不接纳旧提交结果', async () => {
    let resolve!: () => void
    const submit = vi.fn(() => new Promise<void>((done) => {
      resolve = done
    }))
    let api!: ReturnType<typeof useVbenForm>[1]
    const wrapper = mount(defineComponent({
      setup() {
        const [Form, formApi] = useVbenForm({ handleSubmit: submit })
        api = formApi
        return () => h(Form)
      },
    }))
    const first = api.submitForm()
    const second = api.submitForm()
    await vi.waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
    expect(wrapper.find('button.is-loading').exists()).toBe(true)
    wrapper.unmount()
    resolve()
    await Promise.all([first, second])
    expect(api.getLatestSubmissionValues()).toEqual({})
    await expect(api.getValues()).rejects.toThrow('卸载')
  })

  it.each([
    { schema: [{ component: 'ApiSelect', fieldName: 'id', label: 'ID' }] },
    { fieldMappingTime: [] },
    { schema: [{ component: 'Input', fieldName: 'user.name', label: '名称' }] },
    { schema: [{ component: 'Input', fieldName: 'id', label: 'ID', rules: 'unknown' }] },
  ])('不兼容配置明确报错 %#', (input) => {
    expect(() => useVbenForm(input as VbenFormProps)).toThrow('[lumal/v5]')
  })
})
