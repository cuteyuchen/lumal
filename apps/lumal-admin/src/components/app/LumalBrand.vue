<script setup lang="ts">
import lumalLogoUrl from '../../assets/lumal-logo.svg'

withDefaults(defineProps<{
  compact?: boolean
  inverse?: boolean
  subtitle?: string
  title?: string
}>(), {
  compact: false,
  subtitle: '',
  title: 'Lumal Admin',
})
</script>

<template>
  <span class="lumal-brand" :class="{ 'is-compact': compact, 'is-inverse': inverse }">
    <img class="lumal-brand__logo" :src="lumalLogoUrl" alt="" aria-hidden="true">
    <span class="lumal-brand__copy">
      <strong>{{ title }}</strong>
      <small v-if="subtitle">{{ subtitle }}</small>
    </span>
  </span>
</template>

<style scoped lang="scss">
.lumal-brand {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-primary);
}

.lumal-brand__logo {
  width: 44px;
  height: 44px;
  flex: none;
  filter: drop-shadow(0 8px 18px rgb(37 99 235 / 22%));
}

.lumal-brand__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.lumal-brand__copy strong {
  overflow: hidden;
  font-size: calc(var(--lumal-font-size-base, 14px) * 1.21428571);
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lumal-brand__copy small {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.78571429);
  line-height: 1.3;
}

.lumal-brand.is-compact {
  gap: 9px;
}

.lumal-brand.is-compact .lumal-brand__logo {
  width: 34px;
  height: 34px;
}

.lumal-brand.is-compact .lumal-brand__copy strong {
  font-size: calc(var(--lumal-font-size-base, 14px) * 1.07142857);
}

.lumal-brand.is-inverse {
  color: #f8fafc;
}

.lumal-brand.is-inverse .lumal-brand__copy small {
  color: #94a3b8;
}
</style>
