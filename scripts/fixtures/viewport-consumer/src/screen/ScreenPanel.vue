<script setup lang="ts">
/***********************动态尺寸和业务字符串仅由运行时控制*********************/
const dynamicSize = '192px'
const chartOption = { grid: { left: 192 }, textStyle: { fontSize: 14 } }
const active = true
</script>

<template>
  <section class="screen-panel">
    <div class="static-inline" style="width: 192px; height: 96px; font-size: 14px; line-height: 20px; min-width: 320px" />
    <div class="object-inline" :style="{ width: '192px', top: '24px', height: dynamicSize }" />
    <div class="array-inline" :style="[{ height: '96px' }, active && { left: '48px' }, { padding: '24px' }]" />
    <!-- lumal-viewport-ignore -->
    <div class="ignored-inline" style="width: 384px; height: 192px" />
    <div class="viewport-fixed" style="width: 192px" />
    <div class="map-panel" :style="{ width: '192px', top: '24px' }" />
    <div class="dynamic-selector-inline" :data-fixed="active ? 'yes' : 'no'" style="width: 192px">
      <i class="dynamic-selector-child" style="height: 96px" />
    </div>
    <div class="style-presence-inline" :style="{ width: '288px' }">
      <i class="style-presence-child" style="height: 144px" />
    </div>
    <div class="style-value-inline" style="width: 384px; height: 192px" />
    <div class="atomic-inline w-[192px] h-[96px] top-[20px]" aria-label="192px" />
    <!-- eslint-disable-next-line vue/prefer-separate-static-class -->
    <div :class="['w-[192px]', active && 'mt-[20px]']">
      {{ dynamicSize }} {{ chartOption }}
    </div>
  </section>
</template>

<style scoped lang="scss">
$panel-width: 384px;
.screen-panel {
  width: $panel-width;
  font-size: 14px;
  line-height: 20px;
  min-width: 320px;
  min-height: 40px;
  border: 2px solid red;
  margin: 24px;
  padding: 24px;
  --existing: original;
}
.map-panel {
  width: 192px;
}
.ordinary[data-width='192px'] {
  width: 192px;
}
.variable-size {
  width: calc(192px * var(--lumal-viewport-scale));
  height: clamp(40px, 10vw, 192px);
}
.ignored-size {
  /*! lumal-viewport-ignore-next */
  width: 192px;
  height: 96px;
  /*! lumal-viewport-ignore */
  padding: 24px;
}
</style>

<style>
.w-\[192px\] {
  width: 192px;
}
.hover\:top-\[20px\]:hover {
  top: 20px;
}
</style>
