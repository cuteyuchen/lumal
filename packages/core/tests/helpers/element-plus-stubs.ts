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
      model: Object,
    },
    template: '<form class="el-form" @submit.prevent="$emit(\'submit\')"><slot /></form>',
  }),
  ElFormItem: defineComponent({
    name: 'ElFormItem',
    props: {
      label: String,
      prop: String,
      required: Boolean,
    },
    template: '<div class="el-form-item" :data-field="prop"><label>{{ label }}</label><slot /></div>',
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
  ElSubMenu: defineComponent({
    name: 'ElSubMenu',
    props: {
      index: String,
    },
    template: '<section class="el-sub-menu" :data-menu-path="index"><slot name="title" /><slot /></section>',
  }),
  ElTable: defineComponent({
    name: 'ElTable',
    props: {
      data: {
        default: () => [],
        type: Array,
      },
      emptyText: String,
      rowKey: [String, Function],
    },
    template: `
      <div class="el-table">
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
      label: String,
      prop: String,
      width: [String, Number],
    },
    template: '<span class="el-table-column" :data-field="prop">{{ label }}</span>',
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
}
