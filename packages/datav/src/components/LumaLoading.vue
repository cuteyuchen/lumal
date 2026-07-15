<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, useTemplateRef } from 'vue'
import { useSvgAnimationPause } from '../composables/useSvgAnimationPause'
import { cssSize } from '../utils'

type LoadingStatus = 'loading' | 'success' | 'error'
type LoadingVariant = 'ring' | 'dots' | 'pulse'

const props = withDefaults(defineProps<{
  size?: number | string
  label?: string
  status?: LoadingStatus
  variant?: LoadingVariant
  colors?: readonly [string, string]
  duration?: number
}>(), {
  colors: () => ['#02bcfe', '#3be6cb'],
  duration: 1500,
  label: '',
  size: 50,
  status: 'loading',
  variant: 'ring',
})

const root = useTemplateRef<HTMLElement>('root')
const svg = useTemplateRef<SVGSVGElement>('svg')
const animation = useSvgAnimationPause(root, svg)
const primaryColor = computed(() => props.colors[0] ?? '#02bcfe')
const secondaryColor = computed(() => props.colors[1] ?? '#3be6cb')
const rotationDuration = computed(() => `${Math.max(1, props.duration) / 1000}s`)
const colorDuration = computed(() => `${Math.max(1, props.duration * 2) / 1000}s`)
const rootStyle = computed<CSSProperties>(() => ({
  '--luma-loading-duration': rotationDuration.value,
  '--luma-loading-primary': primaryColor.value,
  '--luma-loading-secondary': secondaryColor.value,
  '--luma-loading-size': cssSize(props.size),
}) as CSSProperties)
</script>

<template>
  <div
    ref="root"
    class="luma-loading"
    :class="[`is-${status}`, { 'is-animation-paused': animation.paused.value }]"
    :data-variant="variant"
    :style="rootStyle"
    role="status"
    :aria-live="status === 'loading' ? 'polite' : 'assertive'"
    @focusin="animation.onFocusIn"
    @focusout="animation.onFocusOut"
    @mouseenter="animation.onMouseEnter"
    @mouseleave="animation.onMouseLeave"
  >
    <svg
      v-if="status === 'loading' && variant === 'ring'"
      ref="svg"
      class="luma-loading__visual luma-loading__visual--ring"
      viewBox="0 0 50 50"
      :width="cssSize(size)"
      :height="cssSize(size)"
      aria-hidden="true"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="transparent"
        stroke-width="3"
        stroke-dasharray="31.415, 31.415"
        :stroke="primaryColor"
        stroke-linecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0, 25 25;360, 25 25"
          :dur="rotationDuration"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke"
          :values="`${primaryColor};${secondaryColor};${primaryColor}`"
          :dur="colorDuration"
          repeatCount="indefinite"
        />
      </circle>

      <circle
        cx="25"
        cy="25"
        r="10"
        fill="transparent"
        stroke-width="3"
        stroke-dasharray="15.7, 15.7"
        :stroke="secondaryColor"
        stroke-linecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="360, 25 25;0, 25 25"
          :dur="rotationDuration"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke"
          :values="`${secondaryColor};${primaryColor};${secondaryColor}`"
          :dur="colorDuration"
          repeatCount="indefinite"
        />
      </circle>
    </svg>

    <span v-else class="luma-loading__visual" aria-hidden="true">
      <template v-if="status === 'loading' && variant === 'dots'">
        <i /><i /><i />
      </template>
      <i v-else-if="status === 'loading'" />
      <span v-else class="luma-loading__state-mark">{{ status === 'success' ? '✓' : '!' }}</span>
    </span>

    <div class="luma-loading__label">
      <slot>{{ label }}</slot>
    </div>
  </div>
</template>
