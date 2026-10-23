<script setup lang="ts">
/***********************普通业务数值不可转换*********************/
const point = { coordinate: 192, label: '192px' }
</script>

<template>
  <div class="screen">
    {{ point }}
  </div>
</template>

<style lang="scss">
$size: 192px;
.screen {
  width: $size;
  --existing: original;
  .caption { font-size: 14px; }
}
</style>
