<script setup lang="ts">
import { useVbenForm } from '@lumal/vben-compat/v5'
import { shallowRef } from 'vue'

/***********************Vben 5.7.0 控件与动态依赖*********************/
const submitted = shallowRef('')
const [Form] = useVbenForm({
  wrapperClass: 'grid-cols-2',
  handleSubmit: (values) => { submitted.value = JSON.stringify(values) },
  schema: [
    { component: 'Input', fieldName: 'name', label: '姓名', rules: 'required' },
    { component: 'Select', fieldName: 'role', label: '角色', rules: 'selectRequired', componentProps: { options: [{ label: '管理员', value: 'admin' }, { label: '访客', value: 'guest' }] } },
    { component: 'DatePicker', fieldName: 'date', label: '日期', componentProps: { valueFormat: 'YYYY-MM-DD' }, rules: 'selectRequired' },
    { component: 'Switch', fieldName: 'enabled', label: '扩展字段', defaultValue: true },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      dependencies: {
        triggerFields: ['enabled', 'role'],
        if: values => Boolean(values.enabled),
        disabled: values => values.role === 'guest',
        required: values => values.role === 'admin',
      },
    },
  ],
})
</script>

<template>
  <section class="compat-workspace__section">
    <h2>表单</h2>
    <Form />
    <output aria-label="提交结果">{{ submitted }}</output>
  </section>
</template>
