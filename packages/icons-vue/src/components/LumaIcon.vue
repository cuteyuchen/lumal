<script setup lang="ts">
import type { IconDefinition, IconGradientOptions } from '@luma/icons'
import type { Component } from 'vue'
import { Icon as IconifyIcon } from '@iconify/vue'
import { applySvgGradient, recolorSvgString } from '@luma/icons'
import { computed, useId } from 'vue'
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

const gradientId = `luma-icon-gradient-${useId()}`
const registry = useIconRegistry()

/***********************图标解析*********************/
const resolvedDefinition = computed(() => {
  if (!props.name) {
    return undefined
  }

  return registry.resolve(props.name)
})

const resolvedSvgText = computed(() => {
  const icon = props.icon
  const rawSvg = resolvedDefinition.value?.svgText
    ?? (typeof icon === 'string' && icon.trim().startsWith('<svg') ? icon : '')
    ?? (typeof icon === 'object' && icon && 'svgText' in icon ? String(icon.svgText ?? '') : '')

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
  const registeredComponent = resolvedDefinition.value?.component
  if (typeof registeredComponent === 'function' || (typeof registeredComponent === 'object' && registeredComponent)) {
    return registeredComponent as Component
  }

  if (typeof props.icon === 'object' && props.icon && 'component' in props.icon) {
    const component = props.icon.component
    return typeof component === 'function' || (typeof component === 'object' && component)
      ? component as Component
      : undefined
  }

  return typeof props.icon === 'function' || typeof props.icon === 'object'
    ? props.icon as Component
    : undefined
})

const resolvedIconify = computed(() => {
  if (resolvedDefinition.value?.source === 'iconify') {
    return resolvedDefinition.value.icon
  }

  if (typeof props.icon === 'object' && props.icon && 'source' in props.icon && props.icon.source === 'iconify') {
    return props.icon.icon
  }

  return undefined
})

/***********************渲染状态*********************/
const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size ?? '1em'

  return {
    '--luma-icon-size': size,
    'color': props.color,
  }
})

const hasIcon = computed(() => Boolean(resolvedSvgText.value || resolvedComponent.value || resolvedIconify.value))

const resolvedTitle = computed(() => props.title ?? resolvedDefinition.value?.label)
</script>

<template>
  <span
    v-if="hasIcon"
    class="luma-icon"
    :style="iconStyle"
    :title="resolvedTitle"
    aria-hidden="true"
  >
    <component :is="resolvedComponent" v-if="resolvedComponent" class="luma-icon__component" />
    <IconifyIcon v-else-if="resolvedIconify" class="luma-icon__component" :icon="resolvedIconify" />
    <span v-else class="luma-icon__svg" v-html="resolvedSvgText" />
  </span>
</template>

<style scoped lang="scss">
.luma-icon {
  display: inline-flex;
  width: var(--luma-icon-size);
  height: var(--luma-icon-size);
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: -0.125em;
}

.luma-icon__svg,
.luma-icon__component {
  width: 100%;
  height: 100%;
}

.luma-icon__svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
