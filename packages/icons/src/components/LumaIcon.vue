<script setup lang="ts">
import type { Component } from 'vue'
import type { IconDefinition, IconGradientOptions } from '../types'
import { computed, useId } from 'vue'
import { resolveIconDefinition } from '../registry/icons'
import { applySvgGradient, recolorSvgString } from '../runtime/svg'

/***********************属性定义*********************/
const props = defineProps<{
  name?: string
  icon?: Component | IconDefinition | string
  size?: number | string
  color?: string
  gradient?: IconGradientOptions
  title?: string
}>()

const gradientId = `luma-icon-gradient-${useId()}`

/***********************图标解析*********************/
const resolvedDefinition = computed(() => {
  if (!props.name) {
    return undefined
  }

  return resolveIconDefinition(props.name)
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
  if (resolvedDefinition.value?.component) {
    return resolvedDefinition.value.component
  }

  if (typeof props.icon === 'object' && props.icon && 'component' in props.icon) {
    return props.icon.component
  }

  return typeof props.icon === 'function' || typeof props.icon === 'object'
    ? props.icon as Component
    : undefined
})

/***********************渲染状态*********************/
const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size ?? '1em'

  return {
    '--luma-icon-size': size,
    'color': props.color,
  }
})

const hasIcon = computed(() => Boolean(resolvedSvgText.value || resolvedComponent.value))

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
