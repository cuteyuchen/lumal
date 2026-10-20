<script setup lang="ts">
import type { FormController, NativeForm } from './form'
import { LumalSchemaForm } from '@lumal/core/components'
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

/***********************表单渲染与生命周期*********************/
const props = defineProps<{ controller: FormController }>()
const formRef = useTemplateRef<NativeForm>('formRef')
const state = computed(() => props.controller.state.value)
const columns = computed(() => Number(state.value.wrapperClass?.match(/(?:^|\s)grid-cols-(\d+)/)?.[1] ?? 1))
onMounted(() => {
  if (formRef.value)
    props.controller.mount(formRef.value)
})
onBeforeUnmount(() => props.controller.unmount())
</script>

<template>
  <div class="lumal-v5-form">
    <p v-if="controller.failure.value" role="alert">
      {{ controller.failure.value }}
    </p>
    <LumalSchemaForm
      ref="formRef"
      :model-value="controller.values.value"
      :schemas="controller.schemas.value"
      :columns="columns"
      :disabled="state.commonConfig?.disabled"
      :submit-disabled="state.submitButtonOptions?.disabled"
      :label-width="state.commonConfig?.labelWidth"
      :label-position="state.layout === 'vertical' ? 'top' : 'right'"
      :submit-on-enter="state.submitOnEnter"
      :scroll-to-first-error="state.scrollToFirstError ?? false"
      :show-actions="state.showDefaultActions"
      :show-reset="state.resetButtonOptions?.show !== false"
      :submit-text="state.submitButtonOptions?.content"
      :reset-text="state.resetButtonOptions?.content"
      :submit-loading="controller.submitting.value || state.submitButtonOptions?.loading"
      @update:model-value="controller.update"
      @values-change="controller.changed"
      @submit="controller.submitFromUi"
      @reset="controller.reset"
    >
      <template v-for="field in state.schema?.filter(item => $slots[item.fieldName])" :key="field.fieldName" #[`field-${field.fieldName}`]="scope">
        <slot
          :name="field.fieldName"
          :model-value="scope.value"
          :on-update:model-value="(value: unknown) => controller.api.setFieldValue(field.fieldName, value)"
          :values="scope.model"
        />
      </template>
    </LumalSchemaForm>
  </div>
</template>
