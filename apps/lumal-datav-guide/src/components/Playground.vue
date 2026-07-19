<script setup lang="ts">
import type { SchemaFormItem } from '@lumal/core/components'
import { LumalSchemaForm } from '@lumal/core/components'
import { computed, ref, useId } from 'vue'
import CodeBlock from './CodeBlock.vue'

/** 单个可调属性的控件定义。 */
export interface PlaygroundControl {
  /** 绑定的 prop 名，同时作为 model 的键。 */
  key: string
  /** 控件标签，缺省用 key。 */
  label?: string
  type: 'number' | 'text' | 'boolean' | 'select' | 'color'
  /** select 选项。 */
  options?: { label: string, value: string | number }[]
  min?: number
  max?: number
  step?: number
  /** 一句话说明，显示在控件下方。 */
  hint?: string
  /**
   * 生成代码时是否作为字符串字面量渲染（text/color 默认字符串；其余默认 :prop 绑定）。
   * 显式置 true 会输出 prop="value"，false 会输出 :prop="value"。
   */
  asString?: boolean
  /**
   * 仅用于表单调试、不写入生成代码的虚拟字段（如 colors 拆成 color1/color2）。
   */
  omitFromCode?: boolean
  /**
   * 按当前 model 决定是否隐藏该控件（如边框变体不支持的字段）。
   */
  hidden?: boolean | ((model: Record<string, unknown>) => boolean)
}

const props = withDefaults(defineProps<{
  title: string
  description?: string
  /** @lumal/datav 组件名，用于生成代码，如 'LumalBorderBox'。 */
  componentName: string
  controls: PlaygroundControl[]
  /** 控件面板列数，默认 2。 */
  columns?: number
  /** 预览区背景。 */
  surface?: 'dark' | 'plain'
  /** 预览区最小高度，默认 220px。 */
  minHeight?: number
  /** 组件内部插槽的代码文本，会渲染进生成代码的标签体。 */
  slotCode?: string
  /**
   * 自定义代码生成。返回完整代码串时覆盖默认生成逻辑；
   * 用于 config 对象等无法由属性平铺表达的场景。
   */
  codeGen?: (model: Record<string, unknown>) => string
}>(), {
  columns: 2,
})

/**
 * 当前属性值集合，由页面通过 v-model 提供并保持响应式。
 * 必须用 v-model（或 :model-value + @update:model-value），单向 :model-value 时表单改值不会回写。
 *
 * LumalSchemaForm 会整体替换 model 对象；这里就地 merge，兼容父页 reactive() 绑定，
 * 避免引用断开导致预览不更新。
 */
const model = defineModel<Record<string, unknown>>({ required: true })
const showCode = ref(false)
const codeId = `playground-code-${useId()}`

function handleModelUpdate(next: Record<string, unknown>): void {
  // 只合并回写，不删除隐藏控件对应的键，避免切换 variant 后丢失暂存值。
  Object.assign(model.value, next)
}

function isControlHidden(control: PlaygroundControl): boolean {
  if (typeof control.hidden === 'function')
    return control.hidden(model.value)
  return Boolean(control.hidden)
}

const visibleControls = computed(() => props.controls.filter(control => !isControlHidden(control)))

/** 把 Playground 控件定义映射为 LumalSchemaForm 的 schema。 */
const schemas = computed<SchemaFormItem[]>(() =>
  visibleControls.value.map((control) => {
    const label = control.label ?? control.key
    const help = control.hint

    if (control.type === 'boolean') {
      return { field: control.key, label, component: 'switch', help }
    }
    if (control.type === 'select') {
      return {
        field: control.key,
        label,
        component: 'select',
        options: control.options ?? [],
        help,
      }
    }
    if (control.type === 'number') {
      return {
        field: control.key,
        label,
        component: 'number',
        componentProps: {
          min: control.min,
          max: control.max,
          step: control.step ?? 1,
          controlsPosition: 'right',
        },
        help,
      }
    }
    if (control.type === 'color') {
      return {
        field: control.key,
        label,
        component: 'input',
        componentProps: { type: 'color' },
        help,
      }
    }
    return { field: control.key, label, component: 'input', help }
  }),
)

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string')
    return JSON.stringify(value)
  if (Array.isArray(value))
    return `[${value.map(stringifyValue).join(', ')}]`
  return String(value)
}

/** camelCase prop 名转 kebab-case，贴合 Vue 模板惯例。 */
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** 把一个属性渲染成模板中的 attribute 片段。 */
function attrFor(control: PlaygroundControl, value: unknown): string | null {
  if (control.omitFromCode || isEmpty(value))
    return null

  const name = kebab(control.key)
  const useString = control.asString ?? (
    control.type === 'text'
    || control.type === 'color'
    || (control.type === 'select' && typeof value === 'string')
  )
  if (useString) {
    // 空串已在上面过滤；字符串字面量走静态属性。
    return `${name}="${String(value)}"`
  }
  return `:${name}="${stringifyValue(value)}"`
}

const generatedCode = computed(() => {
  if (props.codeGen)
    return props.codeGen(model.value)

  const attrs = visibleControls.value
    .map(c => attrFor(c, model.value[c.key]))
    .filter((a): a is string => a !== null)

  const tag = props.componentName
  const inner = props.slotCode?.trim()

  if (!attrs.length && !inner)
    return `<${tag} />`

  const attrLines = attrs.length ? `\n  ${attrs.join('\n  ')}\n` : ''
  if (!inner)
    return `<${tag}${attrLines || ' '}/>`

  const indentedInner = inner.split('\n').map(line => `  ${line}`).join('\n')
  return `<${tag}${attrLines || ' '}>\n${indentedInner}\n</${tag}>`
})
</script>

<template>
  <section class="playground">
    <header class="playground__head">
      <div>
        <h3 class="playground__title">
          {{ title }}
        </h3>
        <p v-if="description" class="playground__desc">
          {{ description }}
        </p>
      </div>
      <button
        type="button"
        class="playground__toggle"
        :aria-controls="codeId"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        {{ showCode ? '收起代码' : '查看代码' }}
      </button>
    </header>

    <div
      class="playground__stage"
      :class="`playground__stage--${surface ?? 'dark'}`"
      :style="{ minHeight: `${minHeight ?? 220}px` }"
    >
      <slot :model="model" />
    </div>

    <div class="playground__controls">
      <LumalSchemaForm
        :model-value="model"
        :schemas="schemas"
        :columns="columns"
        label-position="top"
        compact
        @update:model-value="handleModelUpdate"
      />
    </div>

    <CodeBlock v-if="showCode" :id="codeId" :code="generatedCode" language="vue" />
  </section>
</template>

<style scoped>
.playground {
  margin: 0 0 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.playground__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px 10px;
}

.playground__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.playground__desc {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.playground__toggle {
  flex-shrink: 0;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}

.playground__toggle:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.playground__toggle:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.playground__stage {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
}

.playground__stage--dark {
  background: radial-gradient(120% 120% at 50% 0%, #0b1f3a 0%, #050d1c 70%, #030814 100%);
  color: #edf9ff;
}

.playground__stage--plain {
  background: var(--el-fill-color-lighter);
}

.playground__controls {
  padding: 18px 16px 4px;
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-lighter);
}

.playground :deep(.code-block) {
  margin: 0;
  border: none;
  border-top: 1px solid var(--el-border-color);
  border-radius: 0;
}
</style>
