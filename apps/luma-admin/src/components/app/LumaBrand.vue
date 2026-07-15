<script setup lang="ts">
import lumaLogoUrl from '../../assets/luma-logo.svg'

withDefaults(defineProps<{
  compact?: boolean
  inverse?: boolean
  subtitle?: string
  title?: string
}>(), {
  compact: false,
  subtitle: '',
  title: 'Luma Admin',
})
</script>

<template>
  <span class="luma-brand" :class="{ 'is-compact': compact, 'is-inverse': inverse }">
    <img class="luma-brand__logo" :src="lumaLogoUrl" alt="" aria-hidden="true">
    <span class="luma-brand__copy">
      <strong>{{ title }}</strong>
      <small v-if="subtitle">{{ subtitle }}</small>
    </span>
  </span>
</template>

<style scoped lang="scss">
.luma-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-primary);
}

.luma-brand__logo {
  width: 44px;
  height: 44px;
  flex: none;
  filter: drop-shadow(0 8px 18px rgb(37 99 235 / 22%));
}

.luma-brand__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.luma-brand__copy strong {
  overflow: hidden;
  font-size: calc(var(--luma-font-size-base, 14px) + 3px);
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-brand__copy small {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 3px);
  line-height: 1.3;
}

.luma-brand.is-compact {
  gap: 9px;
}

.luma-brand.is-compact .luma-brand__logo {
  width: 34px;
  height: 34px;
}

.luma-brand.is-compact .luma-brand__copy strong {
  font-size: calc(var(--luma-font-size-base, 14px) + 1px);
}

.luma-brand.is-inverse {
  color: #f8fafc;
}

.luma-brand.is-inverse .luma-brand__copy small {
  color: #94a3b8;
}
</style>
