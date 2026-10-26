<script setup lang="ts">
/***********************脚本和内联样式保留显式适配责任*********************/
const chartOption = { grid: { left: 192 }, textStyle: { fontSize: 14 } }
</script>

<template>
  <article class="screen-controlled" :style="{ top: '192px' }">
    <h2 class="caption">
      Workspace
    </h2>
    <div class="screen-pinned">
      {{ chartOption }}
    </div>
    <div class="screen-map screen-adapted screen-css" />
  </article>
</template>

<style scoped lang="scss">
$panel-width: 384px;
.screen-controlled {
  width: $panel-width;
  height: 192px;
  min-width: 320px;
  min-height: 40px;
  padding: 24px;
  margin: 24px;
  border: 2px solid red;
  gap: 12px;
  --existing: original;
  .caption {
    font-size: 14px;
    line-height: 20px;
  }
}
.screen-fixed, .screen-map {
  width: 192px;
}
.screen-pinned {
  /*! lumal-viewport-ignore-next */
  width: 192px;
  height: 192px;
  /*! lumal-viewport-ignore */
  padding: 24px;
}
.screen-adapted {
  width: calc(192px * var(--lumal-viewport-scale));
  height: calc(var(--panel-height) + 24px);
  padding: clamp(12px, 2vw, 24px);
}
</style>

<style scoped>
.screen-css {
  width: 192px;
  font-size: 14px;
  line-height: 20px;
  min-height: 40px;
}
</style>

<style lang="scss">
@use '../shared/panel.scss';
@use '../admin/panel.scss' as admin;
.screen-mixed-controls {
  width: 384px;
  min-height: 40px;
  line-height: 20px;
}
</style>
