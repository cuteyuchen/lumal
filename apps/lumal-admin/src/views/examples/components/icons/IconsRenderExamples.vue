<script setup lang="ts">
import type { IconGradientOptions } from '@lumal/icons'
import { LumalIcon, useIconRegistry } from '@lumal/icons-vue'
import { ElButton, ElOption, ElSelect, ElSlider, ElSwitch } from 'element-plus'
import { computed, shallowRef, watch } from 'vue'

/***********************渲染参数*********************/
const selectedIcon = defineModel<string>({ required: true })
const size = shallowRef(48)
const color = shallowRef('#2563eb')
const inheritColor = shallowRef(false)
const gradientEnabled = shallowRef(false)
const registry = useIconRegistry()
const selectedDefinition = computed(() => registry.resolve(selectedIcon.value))
// 渐变处理只针对本地 SVG；Iconify 和组件图标保留各自的渲染协议。
const gradient = computed<IconGradientOptions | undefined>(() => selectedDefinition.value?.svgText && gradientEnabled.value && !inheritColor.value
  ? { from: color.value, to: '#10b981' }
  : undefined)
const sourceExamples = [
  { key: 'app:dashboard', label: '本地 SVG' },
  { key: 'iconify:admin-demo:badge', label: 'Iconify' },
  { key: 'element-plus:Edit', label: 'Element Plus' },
  { key: 'component:brand', label: 'Vue 组件' },
]

/***********************输入方式与调用代码*********************/
function createExampleCode(binding: string, setup = ''): string {
  const attributes = [
    binding,
    `:size="${size.value}"`,
    ...(!inheritColor.value ? [`color="${color.value}"`] : []),
    ...(gradient.value ? [`:gradient='${JSON.stringify(gradient.value)}'`] : []),
  ]
  const iconLines = ['<LumalIcon', ...attributes.map(attribute => `  ${attribute}`), '/>']
  const templateLines = inheritColor.value
    ? ['  <span style="color: var(--el-color-success)">', ...iconLines.map(line => `    ${line}`), '  </span>']
    : iconLines.map(line => `  ${line}`)

  return [
    '<script setup lang="ts">',
    'import { LumalIcon } from \'@lumal/icons-vue\'',
    'import \'@lumal/icons-vue/style.css\'',
    ...(setup ? ['', setup] : []),
    // 分开闭合标签，避免示例字符串提前结束当前组件的 script。
    '</' + 'script>',
    '',
    '<template>',
    ...templateLines,
    '</template>',
  ].join('\n')
}

const renderExamples = computed(() => {
  const definition = selectedDefinition.value
  const definitionSetup = definition?.source === 'component'
    ? `import { resolveIconDefinition } from '@lumal/icons'\n\n/***********************图标定义*********************/\nconst iconDefinition = resolveIconDefinition(${JSON.stringify(selectedIcon.value)})`
    : `import type { IconDefinition } from '@lumal/icons'\n\n/***********************图标定义*********************/\nconst iconDefinition: IconDefinition = ${JSON.stringify(definition, null, 2)}`

  return [
    {
      key: 'name',
      label: '注册名称',
      signature: 'name: string',
      iconProps: { name: selectedIcon.value },
      code: createExampleCode(`name="${selectedIcon.value}"`),
    },
    ...(definition
      ? [{
          key: 'definition',
          label: '直接定义',
          signature: 'icon: IconDefinition',
          iconProps: { icon: definition },
          code: createExampleCode(':icon="iconDefinition"', definitionSetup),
        }]
      : []),
    ...(definition?.svgText
      ? [{
          key: 'svg',
          label: '可信 SVG',
          signature: 'icon: string',
          iconProps: { icon: definition.svgText },
          code: createExampleCode(':icon="svgText"', `/***********************可信 SVG*********************/\nconst svgText = ${JSON.stringify(definition.svgText)}`),
        }]
      : []),
  ]
})

/***********************示例代码复制*********************/
const copying = shallowRef(false)
const feedback = shallowRef('')

watch(renderExamples, () => {
  feedback.value = ''
})

async function copyExample(code: string, label: string): Promise<void> {
  copying.value = true
  try {
    await navigator.clipboard.writeText(code)
    feedback.value = `${label}示例已复制`
  }
  catch {
    feedback.value = '复制失败，请检查剪贴板权限'
  }
  finally {
    copying.value = false
  }
}
</script>

<template>
  <section class="icons-render-examples" aria-label="图标渲染">
    <div class="icons-render-examples__controls">
      <label class="icons-render-examples__field">
        <span>图标</span>
        <ElSelect v-model="selectedIcon" aria-label="预览图标" filterable>
          <ElOption v-for="icon in registry.icons.value" :key="icon.key" :value="icon.key" :label="`${icon.label || icon.key} (${icon.key})`" />
        </ElSelect>
      </label>
      <label class="icons-render-examples__field">
        <span>尺寸 {{ size }}px</span>
        <ElSlider v-model="size" aria-label="图标尺寸" :min="12" :max="80" :step="4" />
      </label>
      <label class="icons-render-examples__toggle"><span>颜色</span><input v-model="color" type="color" aria-label="图标颜色" :disabled="inheritColor"></label>
      <label class="icons-render-examples__toggle"><span>继承颜色</span><ElSwitch v-model="inheritColor" aria-label="继承父级颜色" /></label>
      <label class="icons-render-examples__toggle"><span>SVG 渐变</span><ElSwitch v-model="gradientEnabled" :disabled="inheritColor || !selectedDefinition?.svgText" aria-label="SVG 渐变" /></label>
    </div>

    <div class="icons-render-examples__previews">
      <figure v-for="example in renderExamples" :key="example.key" :data-render-example="example.key">
        <div class="icons-render-examples__stage" :data-preview="example.key">
          <LumalIcon v-bind="example.iconProps" :size="size" :color="inheritColor ? undefined : color" :gradient="gradient" />
        </div>
        <figcaption class="icons-render-examples__caption">
          <span class="icons-render-examples__caption-label">
            <strong>{{ example.label }}</strong>
            <code>{{ example.signature }}</code>
          </span>
          <ElButton
            class="icons-render-examples__copy"
            :title="`复制${example.label}示例`"
            :aria-label="`复制${example.label}示例`"
            :disabled="copying"
            @click="copyExample(example.code, example.label)"
          >
            <LumalIcon name="lumal:copy" :size="18" />
          </ElButton>
        </figcaption>
        <pre class="icons-render-examples__code" :aria-label="`${example.label}示例代码`" tabindex="0"><code>{{ example.code }}</code></pre>
      </figure>
    </div>
    <p class="icons-render-examples__feedback" role="status" aria-live="polite">
      {{ feedback }}
    </p>

    <h3 class="icons-render-examples__heading">
      图标来源
    </h3>
    <div class="icons-render-examples__sources">
      <figure v-for="example in sourceExamples" :key="example.key">
        <LumalIcon :name="example.key" :size="32" />
        <figcaption>{{ example.label }}</figcaption>
        <code>{{ example.key }}</code>
      </figure>
    </div>
  </section>
</template>

<style scoped lang="scss">
.icons-render-examples__controls {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) minmax(160px, 1fr) repeat(3, auto);
  align-items: center;
  gap: 24px;
}

.icons-render-examples__field {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.icons-render-examples__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icons-render-examples__toggle input {
  width: 44px;
  height: 32px;
}

.icons-render-examples__previews,
.icons-render-examples__sources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 16px;
  margin-top: 24px;
}

.icons-render-examples figure {
  display: grid;
  min-width: 0;
  gap: 12px;
  justify-items: center;
  margin: 0;
}

.icons-render-examples__stage {
  display: grid;
  width: 100%;
  height: 160px;
  place-items: center;
  color: var(--el-color-success);
  background: var(--el-fill-color-light);
}

.icons-render-examples figcaption {
  color: var(--el-text-color-secondary);
}

.icons-render-examples__caption {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.icons-render-examples__caption-label {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.icons-render-examples__caption-label strong {
  color: var(--el-text-color-primary);
}

.icons-render-examples__caption-label code,
.icons-render-examples__code,
.icons-render-examples__feedback {
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.92857143);
}

.icons-render-examples__copy {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
}

.icons-render-examples__code {
  box-sizing: border-box;
  width: 100%;
  height: 300px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.icons-render-examples__code:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.icons-render-examples__feedback {
  min-height: 20px;
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
}

.icons-render-examples code {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.icons-render-examples__heading {
  margin: 28px 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-light);
  font-size: calc(var(--lumal-font-size-base, 14px) * 1.14285714);
}

@media (max-width: 1100px) {
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .icons-render-examples__controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .icons-render-examples__controls {
    grid-template-columns: minmax(0, 1fr);
  }

  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .icons-render-examples__copy {
    width: 44px;
    height: 44px;
  }
}
</style>
