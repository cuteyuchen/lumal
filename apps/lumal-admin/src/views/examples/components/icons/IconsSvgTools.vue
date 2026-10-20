<script setup lang="ts">
import type { IconGradientOptions } from '@lumal/icons'
import { composeSvgIcons, getGradientIconDataUri, getIconDataUri, recolorSvgString, svgToDataUri, validateMonochromeSvg } from '@lumal/icons'
import { LumalIcon, useIconRegistry } from '@lumal/icons-vue'
import { ElButton, ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus'
import { computed, shallowRef, useId, watch } from 'vue'

/***********************可信 SVG 输入*********************/
// 只处理注册表中的静态资源，不接受上传或任意输入的 SVG 文本。
const registry = useIconRegistry()
const svgIcons = computed(() => registry.icons.value.filter(icon => icon.svgText))
const selectedIcon = shallowRef('app:user')
const overlayIcon = shallowRef('lumal:plus')
const operation = shallowRef('recolor')
const color = shallowRef('#2563eb')
const endColor = shallowRef('#10b981')
const direction = shallowRef<'horizontal' | 'vertical'>('horizontal')
const gradientId = `admin-svg-${useId()}`
const sourceSvg = computed(() => registry.resolve(selectedIcon.value)?.svgText ?? '')
const validation = computed(() => validateMonochromeSvg(sourceSvg.value))
const gradient = computed<IconGradientOptions>(() => ({
  id: gradientId,
  from: color.value,
  to: endColor.value,
  direction: direction.value,
}))

/***********************SVG 与 Data URI 输出*********************/
const dataUri = computed(() => {
  if (operation.value === 'gradient')
    return getGradientIconDataUri(selectedIcon.value, gradient.value)
  if (operation.value === 'compose') {
    const svg = composeSvgIcons([sourceSvg.value, registry.resolve(overlayIcon.value)?.svgText ?? ''])
    return svgToDataUri(recolorSvgString(svg, color.value))
  }
  return getIconDataUri(selectedIcon.value, color.value)
})
// 以实际导出的 SVG 为准，确保预览、复制和下载均保留相同的命名空间。
const outputSvg = computed(() => decodeURIComponent(dataUri.value.slice(dataUri.value.indexOf(',') + 1)))
const outputs = computed(() => [
  { key: 'svg', label: 'SVG 输出', ariaLabel: 'SVG 输出', value: outputSvg.value },
  { key: 'data-uri', label: 'Data URI', ariaLabel: 'Data URI 输出', value: dataUri.value },
])

/***********************输出复制*********************/
const copying = shallowRef(false)
const feedback = shallowRef('')

watch(dataUri, () => {
  feedback.value = ''
})

async function copyOutput(value: string, label: string): Promise<void> {
  copying.value = true
  feedback.value = `正在复制 ${label}`
  try {
    await navigator.clipboard.writeText(value)
    feedback.value = `${label}已复制`
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
  <section class="icons-svg-tools" aria-label="SVG 工具">
    <div class="icons-svg-tools__controls">
      <label class="icons-svg-tools__field">
        <span>源图标</span>
        <ElSelect v-model="selectedIcon" aria-label="SVG 源图标" filterable>
          <ElOption v-for="icon in svgIcons" :key="icon.key" :value="icon.key" :label="`${icon.label || icon.key} (${icon.key})`" />
        </ElSelect>
      </label>
      <div class="icons-svg-tools__field">
        <span>处理方式</span>
        <ElRadioGroup v-model="operation" aria-label="SVG 处理方式">
          <ElRadioButton value="recolor">
            改色
          </ElRadioButton>
          <ElRadioButton value="gradient">
            渐变
          </ElRadioButton>
          <ElRadioButton value="compose">
            合成
          </ElRadioButton>
        </ElRadioGroup>
      </div>
      <div class="icons-svg-tools__settings">
        <label class="icons-svg-tools__field">
          <span>{{ operation === 'gradient' ? '起始色' : '颜色' }}</span>
          <span class="icons-svg-tools__swatch">
            <input v-model="color" type="color" aria-label="SVG 颜色">
            <code>{{ color }}</code>
          </span>
        </label>
        <template v-if="operation === 'gradient'">
          <label class="icons-svg-tools__field">
            <span>结束色</span>
            <span class="icons-svg-tools__swatch">
              <input v-model="endColor" type="color" aria-label="渐变结束色">
              <code>{{ endColor }}</code>
            </span>
          </label>
          <label class="icons-svg-tools__field icons-svg-tools__field--compact">
            <span>渐变方向</span>
            <ElSelect v-model="direction" aria-label="渐变方向">
              <ElOption label="水平" value="horizontal" />
              <ElOption label="垂直" value="vertical" />
            </ElSelect>
          </label>
        </template>
        <label v-if="operation === 'compose'" class="icons-svg-tools__field icons-svg-tools__field--compact">
          <span>叠加图标</span>
          <ElSelect v-model="overlayIcon" aria-label="叠加图标" filterable>
            <ElOption v-for="icon in svgIcons" :key="icon.key" :value="icon.key" :label="icon.label || icon.key" />
          </ElSelect>
        </label>
      </div>
    </div>

    <div class="icons-svg-tools__preview">
      <figure class="icons-svg-tools__sample">
        <LumalIcon :icon="outputSvg" :size="80" />
        <figcaption>SVG</figcaption>
      </figure>
      <figure class="icons-svg-tools__sample">
        <img :src="dataUri" width="80" height="80" alt="Data URI 预览">
        <figcaption>Data URI</figcaption>
      </figure>
      <div class="icons-svg-tools__result">
        <span class="icons-svg-tools__validation" role="status">源图标单色校验：{{ validation.valid ? '通过' : validation.reason }}</span>
        <ElButton tag="a" :href="dataUri" :download="`${selectedIcon.replaceAll(':', '-')}.svg`" type="primary">
          <LumalIcon name="lumal:download" :size="16" /><span class="icons-svg-tools__download-label">下载 SVG</span>
        </ElButton>
      </div>
    </div>

    <div class="icons-svg-tools__outputs">
      <div v-for="output in outputs" :key="output.key" class="icons-svg-tools__output">
        <div class="icons-svg-tools__output-header">
          <label :for="`${gradientId}-${output.key}`">{{ output.label }}</label>
          <ElButton
            class="icons-svg-tools__copy"
            :title="`复制 ${output.label}`"
            :aria-label="`复制 ${output.label}`"
            :disabled="copying || !output.value"
            @click="copyOutput(output.value, output.label)"
          >
            <LumalIcon name="lumal:copy" :size="18" />
          </ElButton>
        </div>
        <textarea
          :id="`${gradientId}-${output.key}`"
          class="icons-svg-tools__textarea"
          :value="output.value"
          :aria-label="output.ariaLabel"
          readonly
          rows="8"
          spellcheck="false"
        />
      </div>
    </div>
    <p class="icons-svg-tools__feedback" role="status" aria-live="polite">
      {{ feedback }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.icons-svg-tools {
  display: grid;
  min-width: 0;
  gap: 20px;
}

.icons-svg-tools__controls {
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  align-items: start;
  gap: 20px 24px;
}

.icons-svg-tools__field {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.icons-svg-tools__field--compact {
  width: 180px;
  max-width: 100%;
}

.icons-svg-tools__settings {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 16px 24px;
}

.icons-svg-tools__swatch {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
}

.icons-svg-tools__swatch input {
  width: 40px;
  height: 36px;
  flex: 0 0 auto;
  padding: 3px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.icons-svg-tools__swatch code {
  color: var(--el-text-color-regular);
  font-size: calc(var(--lumal-font-size-base, 14px) - 1px);
}

.icons-svg-tools__preview {
  display: grid;
  grid-template-columns: repeat(2, 128px) minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: var(--el-fill-color-light);
}

.icons-svg-tools__sample {
  display: grid;
  min-width: 0;
  min-height: 128px;
  gap: 12px;
  align-content: center;
  justify-items: center;
  margin: 0;
}

.icons-svg-tools__preview figcaption {
  color: var(--el-text-color-secondary);
}

.icons-svg-tools__result {
  display: grid;
  min-width: 0;
  gap: 16px;
  justify-content: end;
  justify-items: start;
  overflow-wrap: anywhere;
}

.icons-svg-tools__download-label {
  margin-left: 8px;
}

.icons-svg-tools__outputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.icons-svg-tools__output {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 8px;
}

.icons-svg-tools__output-header {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
}

.icons-svg-tools__copy {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
}

.icons-svg-tools__textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 200px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  font-family: monospace;
  font-size: calc(var(--lumal-font-size-base, 14px) - 1px);
  line-height: 1.6;
  overflow-wrap: anywhere;
  resize: vertical;
}

.icons-svg-tools__textarea:focus-visible,
.icons-svg-tools__swatch input:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.icons-svg-tools__feedback {
  min-height: 20px;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--lumal-font-size-base, 14px) - 1px);
}

@media (max-width: 768px) {
  .icons-svg-tools__controls,
  .icons-svg-tools__outputs {
    grid-template-columns: minmax(0, 1fr);
  }

  .icons-svg-tools__preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .icons-svg-tools__result {
    grid-column: 1 / -1;
    justify-content: start;
  }

  .icons-svg-tools__copy {
    width: 44px;
    height: 44px;
  }
}
</style>
