<script setup lang="ts">
import type { IconDefinition, IconGradientOptions } from '@lumal/icons'
import type { Component } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue'
import { applySvgGradient, recolorSvgString } from '@lumal/icons'
import { computed, toRaw, useId } from 'vue'
import { useIconRegistry } from '../composables/useIconRegistry'

/***********************属性定义*********************/
const props = defineProps<{
  name?: string
  icon?: Component | IconDefinition<Component> | string
  size?: number | string
  color?: string
  gradient?: IconGradientOptions
  title?: string
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

const resolvedSvgText = computed(() => {
  const icon = props.icon
  const rawSvg = resolvedDefinition.value?.svgText
    ?? (typeof icon === 'string' && icon.trim().startsWith('<svg') ? icon : '')

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

/***********************渲染状态*********************/
const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size ?? '1em'

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
