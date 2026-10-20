import type { SchemaFormComponentType, SchemaFormItem, SchemaFormModel } from '@lumal/core/components'
import type { FormSchema, UseVbenFormReturn, V5Resolver, V5Values, VbenFormApi, VbenFormProps } from './types'
import { computed, defineComponent, h, nextTick, onScopeDispose, shallowRef } from 'vue'
import { assertComponentAttrs, assertSupported, cloneValues } from './utils'
import V5Form from './V5Form.vue'

const components: Record<FormSchema['component'], SchemaFormComponentType> = {
  CheckboxGroup: 'checkbox',
  DatePicker: 'date',
  Input: 'input',
  InputNumber: 'number',
  InputPassword: 'input',
  InputTextarea: 'textarea',
  RadioGroup: 'radio',
  Select: 'select',
  Switch: 'switch',
  Textarea: 'textarea',
  TreeSelect: 'tree-select',
}
export interface NativeForm {
  validate: () => Promise<boolean>
  clearValidate: () => void
}
export type FormController = ReturnType<typeof createFormController>

function checkOptions(options: VbenFormProps): void {
  assertSupported(options, ['schema', 'commonConfig', 'layout', 'wrapperClass', 'showDefaultActions', 'submitOnEnter', 'submitOnChange', 'scrollToFirstError', 'submitButtonOptions', 'resetButtonOptions', 'handleSubmit', 'handleReset', 'handleValuesChange'], 'Form')
  if (options.commonConfig)
    assertSupported(options.commonConfig, ['componentProps', 'disabled', 'labelWidth'], 'commonConfig')
  if (options.submitButtonOptions)
    assertSupported(options.submitButtonOptions, ['content', 'loading', 'disabled'], 'submitButtonOptions')
  if (options.resetButtonOptions)
    assertSupported(options.resetButtonOptions, ['content', 'show'], 'resetButtonOptions')
  const fields = new Set<string>()
  for (const field of options.schema ?? []) {
    assertSupported(field, ['fieldName', 'component', 'label', 'defaultValue', 'componentProps', 'rules', 'help', 'dependencies'], 'schema')
    if (!components[field.component])
      throw new Error(`[lumal/v5] 未支持的表单组件：${field.component}`)
    if (!field.fieldName || /[.[\]]/.test(field.fieldName) || fields.has(field.fieldName))
      throw new Error('[lumal/v5] fieldName 必须是唯一的平面字段名，嵌套路径需应用侧映射')
    fields.add(field.fieldName)
    if (field.dependencies)
      assertSupported(field.dependencies, ['triggerFields', 'if', 'show', 'disabled', 'required', 'componentProps'], 'dependencies')
    if (field.rules && typeof field.rules === 'string' && !['required', 'selectRequired'].includes(field.rules))
      throw new Error(`[lumal/v5] 未注册的校验规则：${field.rules}`)
    if (field.rules && typeof field.rules === 'object' && typeof field.rules.safeParseAsync !== 'function')
      throw new Error('[lumal/v5] rules 仅支持 required、selectRequired 或 safeParseAsync 校验器')
  }
}

/***********************表单状态与原生 Schema 适配*********************/
export function createFormController(options: VbenFormProps = {}) {
  checkOptions(options)
  const state = shallowRef<VbenFormProps>({ showDefaultActions: true, ...options })
  const values = shallowRef<V5Values>({})
  const submitting = shallowRef(false)
  const failure = shallowRef('')
  const errors: Record<string, string> = {}
  let instance: NativeForm | undefined
  let disposed = false
  let generation = 0
  let latest: V5Values = {}
  let submission: Promise<V5Values | undefined> | undefined
  let api: VbenFormApi
  function defaults(): V5Values {
    return Object.fromEntries((state.value.schema ?? []).map(field => [field.fieldName, cloneValues(field.defaultValue)]))
  }
  values.value = defaults()
  function assertActive(): void {
    if (disposed)
      throw new Error('[lumal/v5] Form 已卸载')
  }
  function resolve<R>(input: V5Resolver<R> | undefined, model: V5Values, fallback: R): R {
    return input === undefined
      ? fallback
      : typeof input === 'function'
        ? (input as (values: V5Values, api: VbenFormApi) => R)(model, api)
        : input
  }
  const schemas = computed<SchemaFormItem[]>(() => (state.value.schema ?? []).map((field) => {
    const getProps = (model: V5Values) => ({
      ...state.value.commonConfig?.componentProps,
      ...resolve(field.componentProps, model, {}),
      ...resolve(field.dependencies?.componentProps, model, {}),
      ...(field.component === 'InputPassword' ? { type: 'password' } : {}),
    })
    const item: SchemaFormItem = {
      field: field.fieldName,
      label: field.label,
      component: components[field.component],
      defaultValue: field.defaultValue,
      help: field.help,
      hidden: ({ model }) => !resolve(field.dependencies?.if, model, true),
      visible: ({ model }) => resolve(field.dependencies?.show, model, true),
      disabled: ({ model }) => resolve(field.dependencies?.disabled, model, getProps(model).disabled ?? false),
      required: ({ model }) => resolve(field.dependencies?.required, model, typeof field.rules === 'string'),
      componentProps: ({ model }) => getProps(model),
      options: ({ model }) => getProps(model).options ?? [],
      placeholder: typeof field.componentProps === 'object' ? field.componentProps.placeholder : undefined,
      rules: ({ model }) => [{
        async asyncValidator(_rule, value: unknown) {
          delete errors[field.fieldName]
          const required = resolve(field.dependencies?.required, model, typeof field.rules === 'string')
          const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
          let message = required && empty ? `${field.label}不能为空` : ''
          if (!message && field.rules && typeof field.rules === 'object') {
            const parsed = await field.rules.safeParseAsync(value)
            if (!parsed.success)
              message = parsed.error?.issues[0]?.message ?? `${field.label}不合法`
          }
          if (message) {
            errors[field.fieldName] = message
            throw new Error(message)
          }
        },
      }],
    } as SchemaFormItem
    return item
  }))
  function setState(patch: Partial<VbenFormProps> | ((previous: VbenFormProps) => Partial<VbenFormProps>)): void {
    assertActive()
    const next = typeof patch === 'function' ? patch(state.value) : patch
    const merged = {
      ...state.value,
      ...next,
      commonConfig: { ...state.value.commonConfig, ...next.commonConfig },
      submitButtonOptions: { ...state.value.submitButtonOptions, ...next.submitButtonOptions },
      resetButtonOptions: { ...state.value.resetButtonOptions, ...next.resetButtonOptions },
    }
    checkOptions(merged)
    state.value = merged
    const allowed = new Set((merged.schema ?? []).map(field => field.fieldName))
    values.value = { ...defaults(), ...Object.fromEntries(Object.entries(values.value).filter(([key]) => allowed.has(key))) }
  }
  function resetValidation(): void {
    Object.keys(errors).forEach(key => delete errors[key])
    instance?.clearValidate()
    failure.value = ''
  }
  async function validate() {
    assertActive()
    await nextTick()
    if (!instance)
      throw new Error('[lumal/v5] 请先挂载 <Form />')
    resetValidation()
    const valid = await instance.validate()
    return { valid, errors: { ...errors } }
  }
  async function submit(): Promise<V5Values | undefined> {
    assertActive()
    if (submission)
      return submission
    const version = generation
    const pending = (async () => {
      if (!(await validate()).valid)
        return
      if (version !== generation)
        return
      submitting.value = true
      failure.value = ''
      try {
        const snapshot = cloneValues(values.value)
        await state.value.handleSubmit?.(snapshot)
        if (version !== generation)
          return
        latest = snapshot
        return snapshot
      }
      catch (error) {
        if (version === generation)
          failure.value = error instanceof Error ? error.message : String(error)
        throw error
      }
      finally {
        if (version === generation)
          submitting.value = false
      }
    })()
    submission = pending
    try {
      return await pending
    }
    finally {
      if (submission === pending)
        submission = undefined
    }
  }
  api = {
    get isMounted() { return Boolean(instance) },
    async getValues() {
      assertActive()
      return cloneValues(values.value)
    },
    async setValues(next, filterFields = true, shouldValidate = false) {
      assertActive()
      const allowed = new Set((state.value.schema ?? []).map(field => field.fieldName))
      values.value = { ...values.value, ...cloneValues(Object.fromEntries(Object.entries(next).filter(([key]) => !filterFields || allowed.has(key)))) }
      await nextTick()
      if (shouldValidate)
        await validate()
    },
    async setFieldValue(field, value, shouldValidate = false) { await api.setValues({ [field]: value }, true, shouldValidate) },
    async resetForm(next) {
      assertActive()
      values.value = { ...defaults(), ...cloneValues(next?.values ?? {}) }
      await nextTick()
      resetValidation()
    },
    async resetValidate() {
      assertActive()
      resetValidation()
    },
    validate,
    submitForm: async (event) => {
      event?.preventDefault()
      return submit()
    },
    validateAndSubmitForm: submit,
    getState: () => state.value,
    setState,
    updateSchema: patches => setState({ schema: (state.value.schema ?? []).map(field => ({ ...field, ...patches.find(patch => patch.fieldName === field.fieldName) })) }),
    removeSchemaByFields: async fields => setState({ schema: state.value.schema?.filter(field => !fields.includes(field.fieldName)) }),
    getLatestSubmissionValues: () => cloneValues(latest),
  }
  function unmount(): void {
    generation += 1
    instance = undefined
    submission = undefined
    submitting.value = false
    latest = {}
    resetValidation()
  }
  onScopeDispose(() => {
    unmount()
    disposed = true
  }, true)
  return {
    api,
    state,
    values,
    schemas,
    submitting,
    failure,
    mount(native: NativeForm) {
      assertActive()
      if (instance)
        throw new Error('[lumal/v5] 每个 useVbenForm 只能同时挂载一个 Form')
      instance = native
    },
    unmount,
    update(next: SchemaFormModel) { values.value = next },
    changed(next: SchemaFormModel, fields: string[]) {
      state.value.handleValuesChange?.(cloneValues(next), fields)
      if (state.value.submitOnChange)
        void submit().catch(() => {}) // UI 错误已通过 failure 显示，API 调用仍向上传播。
    },
    async reset() {
      await api.resetForm()
      await state.value.handleReset?.()
    },
    async submitFromUi() { await submit().catch(() => {}) },
  }
}

/***********************Vben 5 组件返回契约*********************/
export function useVbenForm<T extends object = V5Values>(options: VbenFormProps<T> = {}): UseVbenFormReturn<T> {
  // 泛型仅约束应用字段；内部渲染统一使用未知值字典，不引入 Vben 的状态运行时。
  const controller = createFormController(options as VbenFormProps)
  const Form = defineComponent({
    name: 'LumalVben5Form',
    inheritAttrs: false,
    setup: (_, { attrs, slots }) => () => {
      assertComponentAttrs(attrs)
      return h(V5Form, { ...attrs, controller }, slots)
    },
  })
  return [Form, controller.api as VbenFormApi<T>]
}
