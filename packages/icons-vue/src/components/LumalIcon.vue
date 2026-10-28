<script setup lang="ts">
import type { IconDefinition, IconGradientOptions } from '@lumal/icons'
import type { Component } from 'vue'
import type { LumalIconMorphSpring } from '../types'
import { Icon as IconifyIcon } from '@iconify/vue'
import { applySvgGradient, recolorSvgString } from '@lumal/icons'
import { viewportLength } from '@lumal/viewport'
import { computed, onErrorCaptured, toRaw, useId } from 'vue'
import { useIconMorph } from '../composables/useIconMorph'
import { useIconRegistry } from '../composables/useIconRegistry'

/***********************属性定义*********************/
const props = defineProps<{
  name?: string
  icon?: Component | IconDefinition<Component> | string
  size?: number | string
  color?: string
  gradient?: IconGradientOptions
  title?: string
  morph?: boolean
  morphSpring?: LumalIconMorphSpring
}>()

const gradientId = `lumal-icon-gradient-${useId()}`
const registry = useIconRegistry()

/***********************图标解析*********************/
const resolvedDefinition = computed(() => {
  const registered = props.name ? registry.resolve(props.name) : undefined
  if (registered)
    return registered
  const icon = props.icon
  return icon && typeof icon === 'object' && 'source' in icon && 'key' in icon
    ? icon as IconDefinition<Component>
    : undefined
})

const rawSvgText = computed(() => {
  const icon = props.icon
  return resolvedDefinition.value?.svgText
    ?? (typeof icon === 'string' && icon.trim().startsWith('<svg') ? icon : '')
})

const resolvedSvgText = computed(() => {
  const rawSvg = rawSvgText.value
  if (!rawSvg) {
    return ''
  }

  if (props.gradient) {
    return applySvgGradient(rawSvg, {
      ...props.gradient,
      id: props.gradient.id ?? gradientId,
    })
  }

  return recolorSvgString(rawSvg, props.color)
})

const resolvedComponent = computed<Component | undefined>(() => {
  if (resolvedDefinition.value) {
    const component = resolvedDefinition.value.source === 'component' ? resolvedDefinition.value.component : undefined
    return typeof component === 'function' || (typeof component === 'object' && component)
      ? toRaw(component as Component)
      : undefined
  }

  return typeof props.icon === 'function' || typeof props.icon === 'object'
    ? toRaw(props.icon as Component)
    : undefined
})

const resolvedIconify = computed(() => {
  if (resolvedDefinition.value?.source === 'iconify') {
    return resolvedDefinition.value.icon
  }

  return undefined
})

/***********************可选状态形变*********************/
const { state: morphState, reset: resetMorph } = useIconMorph(
  rawSvgText,
  () => props.morph === true && !props.gradient && !resolvedComponent.value && !resolvedIconify.value,
)

onErrorCaptured(() => {
  if (morphState.value) {
    resetMorph()
    return false
  }
})

/***********************渲染状态*********************/
const iconStyle = computed(() => {
  // 数值是设计 px，消费项目 Vite 配置决定输出 vw 或 px；显式单位保持原语义。
  const size = typeof props.size === 'number' ? viewportLength(props.size) : props.size ?? '1em'

  return {
    '--lumal-icon-size': size,
    'color': props.color,
  }
})

const hasIcon = computed(() => Boolean(resolvedSvgText.value || resolvedComponent.value || resolvedIconify.value))

const resolvedTitle = computed(() => props.title ?? resolvedDefinition.value?.label)
</script>

<template>
  <span
    v-if="hasIcon"
    class="lumal-icon"
    :style="iconStyle"
    :title="resolvedTitle"
    aria-hidden="true"
  >
    <component :is="resolvedComponent" v-if="resolvedComponent" class="lumal-icon__component" />
    <IconifyIcon v-else-if="resolvedIconify" class="lumal-icon__component" :icon="resolvedIconify" />
    <component
      :is="morphState.component"
      v-else-if="morphState"
      class="lumal-icon__component"
      :icon="morphState.icon"
      :spring="morphSpring ?? 'smooth'"
      :color="morphState.color"
      :stroke-width="morphState.strokeWidth"
      :stroke-linecap="morphState.linecap"
      :stroke-linejoin="morphState.linejoin"
      reduced-motion="user"
      size="100%"
    />
    <span v-else class="lumal-icon__svg" v-html="resolvedSvgText" />
  </span>
</template>

<style scoped lang="scss">
.lumal-icon {
  display: inline-flex;
  width: var(--lumal-icon-size);
  height: var(--lumal-icon-size);
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: -0.125em;
}

.lumal-icon__svg,
.lumal-icon__component {
  width: 100%;
  height: 100%;
}

.lumal-icon__svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
