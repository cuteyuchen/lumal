<script setup lang="ts">
import { useVbenForm } from '@lumal/vben-compat/v5'
import { shallowRef } from 'vue'

/***********************5.7.0 基础控件与动态依赖迁移*********************/
const submitted = shallowRef('')
const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass: 'grid-cols-2',
  handleSubmit(values) { submitted.value = JSON.stringify(values) },
  schema: [
    { component: 'Input', fieldName: 'name', label: '姓名', rules: 'required' },
    { component: 'Select', fieldName: 'role', label: '角色', rules: 'selectRequired', componentProps: { options: [{ label: '管理员', value: 'admin' }, { label: '访客', value: 'guest' }] } },
    { component: 'DatePicker', fieldName: 'date', label: '日期', rules: 'selectRequired', componentProps: { valueFormat: 'YYYY-MM-DD' } },
    { component: 'Switch', fieldName: 'enabled', label: '启用扩展', defaultValue: true },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      dependencies: { triggerFields: ['enabled', 'role'], if: values => Boolean(values.enabled), disabled: values => values.role === 'guest', required: values => values.role === 'admin' },
    },
    { component: 'Input', fieldName: 'cssHidden', label: '保留值字段', defaultValue: 'retained', dependencies: { triggerFields: ['enabled'], show: values => Boolean(values.enabled) } },
  ],
})
defineExpose({ formApi })
</script>

<template>
  <section>
    <h2>Vben 5 表单</h2>
    <Form />
    <output aria-label="提交结果">{{ submitted }}</output>
  </section>
</template>
