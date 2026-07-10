import { defineComponent } from 'vue'

/***********************Element Plus 测试替身*********************/
export const elementPlusStubs = {
  ElAside: defineComponent({
    name: 'ElAside',
    props: {
      width: String,
    },
    template: '<aside class="el-aside" :style="{ width }"><slot /></aside>',
  }),
  ElButton: defineComponent({
    name: 'ElButton',
    props: {
      disabled: Boolean,
      type: String,
    },
    template: '<button class="el-button" :disabled="disabled" v-bind="$attrs"><slot /></button>',
  }),
  ElContainer: defineComponent({
    name: 'ElContainer',
    props: {
      direction: String,
    },
    template: '<section class="el-container" :data-direction="direction"><slot /></section>',
  }),
  ElForm: defineComponent({
    name: 'ElForm',
    props: {
      disabled: Boolean,
      labelPosition: String,
      labelWidth: [String, Number],
      model: Object,
      rules: Object,
    },
    methods: {
      resetFields() {},
      async validate() {
        return true
      },
    },
    template: '<form class="el-form" :data-label-width="labelWidth" @submit.prevent="$emit(\'submit\', $event)"><slot /></form>',
  }),
  ElFormItem: defineComponent({
    name: 'ElFormItem',
    props: {
      label: String,
      prop: String,
      required: Boolean,
      rules: [Array, Object],
    },
    template: '<div class="el-form-item" :data-field="prop"><label>{{ label }}</label><slot /></div>',
  }),
  ElCheckbox: defineComponent({
    name: 'ElCheckbox',
    props: {
      disabled: Boolean,
      label: [String, Number, Boolean],
      modelValue: Boolean,
      value: [String, Number, Boolean],
    },
    emits: ['update:modelValue'],
    template: '<label class="el-checkbox"><input type="checkbox" :checked="modelValue" :disabled="disabled" :value="value ?? label" @change="$emit(\'update:modelValue\', $event.target.checked)"><slot /></label>',
  }),
  ElCheckboxGroup: defineComponent({
    name: 'ElCheckboxGroup',
    props: {
      disabled: Boolean,
      modelValue: Array,
      name: String,
    },
    emits: ['update:modelValue'],
    template: '<div class="el-checkbox-group" :data-name="name"><slot /></div>',
  }),
  ElCol: defineComponent({
    name: 'ElCol',
    props: {
      span: Number,
    },
    template: '<div class="el-col" :data-span="span"><slot /></div>',
  }),
  ElDatePicker: defineComponent({
    name: 'ElDatePicker',
    props: {
      disabled: Boolean,
      modelValue: [String, Number, Array],
      name: String,
      placeholder: String,
      type: String,
    },
    emits: ['update:modelValue'],
    template: '<input class="el-date-editor" :disabled="disabled" :name="name" :placeholder="placeholder" :type="type || \'date\'" :value="Array.isArray(modelValue) ? modelValue.join(\',\') : modelValue ?? \'\'" @input="$emit(\'update:modelValue\', $event.target.value)">',
  }),
  ElDialog: defineComponent({
    name: 'ElDialog',
    props: {
      modelValue: Boolean,
      title: String,
    },
    emits: ['update:modelValue'],
    template: '<section v-if="modelValue" class="el-dialog" :data-title="title"><slot /></section>',
  }),
  ElDivider: defineComponent({
    name: 'ElDivider',
    props: {
      direction: String,
    },
    template: '<div class="el-divider" :data-direction="direction"><slot /></div>',
  }),
  ElInput: defineComponent({
    name: 'ElInput',
    props: {
      disabled: Boolean,
      modelValue: [String, Number, Boolean],
      name: String,
      placeholder: String,
      required: Boolean,
      type: String,
    },
    emits: ['update:modelValue'],
    template: `
      <textarea
        v-if="type === 'textarea'"
        class="el-textarea__inner"
        :disabled="disabled"
        :name="name"
        :placeholder="placeholder"
        :required="required"
        :value="modelValue ?? ''"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <input
        v-else
        class="el-input__inner"
        :disabled="disabled"
        :name="name"
        :placeholder="placeholder"
        :required="required"
        :type="type || 'text'"
        :value="modelValue ?? ''"
        @input="$emit('update:modelValue', $event.target.value)"
      >
    `,
  }),
  ElInputNumber: defineComponent({
    name: 'ElInputNumber',
    props: {
      disabled: Boolean,
      max: Number,
      min: Number,
      modelValue: Number,
      name: String,
      placeholder: String,
      step: Number,
    },
    emits: ['update:modelValue'],
    template: '<input class="el-input-number" :disabled="disabled" :max="max" :min="min" :name="name" :placeholder="placeholder" type="number" :value="modelValue ?? \'\'" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
  }),
  ElMain: defineComponent({
    name: 'ElMain',
    template: '<main class="el-main"><slot /></main>',
  }),
  ElMenu: defineComponent({
    name: 'ElMenu',
    props: {
      collapse: Boolean,
      defaultActive: String,
      router: Boolean,
    },
    emits: ['select'],
    template: '<nav class="el-menu" :data-active="defaultActive" :data-collapse="String(collapse)"><slot /></nav>',
  }),
  ElMenuItem: defineComponent({
    name: 'ElMenuItem',
    props: {
      index: String,
    },
    emits: ['click'],
    template: '<button class="el-menu-item" type="button" :data-menu-path="index" @click="$emit(\'click\')"><slot /></button>',
  }),
  ElOption: defineComponent({
    name: 'ElOption',
    props: {
      disabled: Boolean,
      label: String,
      value: [String, Number, Boolean],
    },
    template: '<option :disabled="disabled" :value="value"><slot>{{ label }}</slot></option>',
  }),
  ElPagination: defineComponent({
    name: 'ElPagination',
    props: {
      currentPage: {
        default: 1,
        type: Number,
      },
      disabled: Boolean,
      pageSize: {
        default: 10,
        type: Number,
      },
      pageSizes: {
        default: () => [10, 20, 50, 100],
        type: Array,
      },
      total: {
        default: 0,
        type: Number,
      },
    },
    emits: ['current-change', 'size-change', 'update:currentPage', 'update:pageSize'],
    methods: {
      changeSize(event: Event) {
        const target = event.target as HTMLSelectElement
        const nextSize = Number(target.value)
        this.$emit('update:pageSize', nextSize)
        this.$emit('size-change', nextSize)
      },
      goNext() {
        const nextPage = this.currentPage + 1
        this.$emit('update:currentPage', nextPage)
        this.$emit('current-change', nextPage)
      },
    },
    template: `
      <nav class="el-pagination">
        <button data-action="next" type="button" :disabled="disabled" @click="goNext">下一页</button>
        <select name="pageSize" :disabled="disabled" :value="pageSize" @change="changeSize">
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </nav>
    `,
  }),
  ElScrollbar: defineComponent({
    name: 'ElScrollbar',
    template: '<div class="el-scrollbar"><slot /></div>',
  }),
  ElSlider: defineComponent({
    name: 'ElSlider',
    props: {
      max: Number,
      min: Number,
      modelValue: Number,
      step: Number,
    },
    emits: ['update:modelValue'],
    template: '<input class="el-slider" type="range" :max="max" :min="min" :step="step" :value="modelValue ?? 0" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
  }),
  ElSelect: defineComponent({
    name: 'ElSelect',
    props: {
      disabled: Boolean,
      modelValue: [String, Number, Boolean],
      name: String,
      placeholder: String,
      required: Boolean,
    },
    emits: ['update:modelValue'],
    template: `
      <select
        class="el-select"
        :disabled="disabled"
        :name="name"
        :required="required"
        :value="modelValue ?? ''"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <slot />
      </select>
    `,
  }),
  ElRadio: defineComponent({
    name: 'ElRadio',
    props: {
      disabled: Boolean,
      label: [String, Number, Boolean],
      value: [String, Number, Boolean],
    },
    template: '<option :disabled="disabled" :value="value ?? label"><slot /></option>',
  }),
  ElRadioGroup: defineComponent({
    name: 'ElRadioGroup',
    props: {
      disabled: Boolean,
      modelValue: [String, Number, Boolean],
      name: String,
    },
    emits: ['update:modelValue'],
    template: '<select class="el-radio-group" :disabled="disabled" :name="name" :value="modelValue ?? \'\'" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  }),
  ElRow: defineComponent({
    name: 'ElRow',
    props: {
      gutter: Number,
    },
    template: '<div class="el-row" :data-gutter="gutter"><slot /></div>',
  }),
  ElSubMenu: defineComponent({
    name: 'ElSubMenu',
    props: {
      index: String,
    },
    template: '<section class="el-sub-menu" :data-menu-path="index"><slot name="title" /><slot /></section>',
  }),
  ElSwitch: defineComponent({
    name: 'ElSwitch',
    props: {
      disabled: Boolean,
      modelValue: Boolean,
      name: String,
    },
    emits: ['update:modelValue'],
    template: '<input class="el-switch" :disabled="disabled" :name="name" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)">',
  }),
  ElTable: defineComponent({
    name: 'ElTable',
    props: {
      border: Boolean,
      cellClassName: [String, Function],
      data: {
        default: () => [],
        type: Array,
      },
      defaultExpandAll: Boolean,
      emptyText: String,
      headerCellClassName: [String, Function],
      rowKey: [String, Function],
      rowClassName: [String, Function],
      stripe: Boolean,
      treeProps: Object,
    },
    emits: ['selection-change'],
    methods: {
      clearSelection() {},
      doLayout() {},
      toggleRowSelection() {},
    },
    template: `
      <div class="el-table" v-bind="$attrs">
        <slot />
        <div v-if="data.length === 0" class="el-table__empty-text">{{ emptyText }}</div>
      </div>
    `,
  }),
  ElTableColumn: defineComponent({
    name: 'ElTableColumn',
    props: {
      align: String,
      formatter: Function,
      fixed: [String, Boolean],
      label: String,
      minWidth: [String, Number],
      prop: String,
      resizable: Boolean,
      showOverflowTooltip: Boolean,
      type: String,
      width: [String, Number],
    },
    template: '<span class="el-table-column" :data-field="prop" :data-type="type"><slot :row="{ id: \'stub-row\' }" :$index="0" />{{ label }}</span>',
  }),
  ElTabPane: defineComponent({
    name: 'ElTabPane',
    props: {
      closable: Boolean,
      label: String,
      name: String,
    },
    template: '<section class="el-tab-pane" :data-tab-path="name">{{ label }}</section>',
  }),
  ElTabs: defineComponent({
    name: 'ElTabs',
    props: {
      modelValue: String,
      type: String,
    },
    emits: ['edit', 'tab-change', 'update:modelValue'],
    template: `
      <div class="el-tabs" :data-active-tab="modelValue">
        <button data-action="change-tab" type="button" @click="$emit('update:modelValue', '/system'); $emit('tab-change', '/system')">切换</button>
        <button data-action="remove-tab" type="button" @click="$emit('edit', modelValue, 'remove')">关闭</button>
        <slot />
      </div>
    `,
  }),
  ElTreeSelect: defineComponent({
    name: 'ElTreeSelect',
    props: {
      data: Array,
      disabled: Boolean,
      modelValue: [String, Number, Boolean, Array],
      name: String,
      placeholder: String,
    },
    emits: ['update:modelValue'],
    template: '<select class="el-tree-select" :disabled="disabled" :name="name" :value="modelValue ?? \'\'" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in data" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
  }),
  ElUpload: defineComponent({
    name: 'ElUpload',
    props: {
      action: String,
      disabled: Boolean,
      limit: Number,
    },
    template: '<div class="el-upload" :data-action="action" :data-limit="limit"><slot /></div>',
  }),
}
