<script setup lang="ts">
import LumalBorderBox from '@lumal/datav/border-box';
import LumalDigitalFlop from '@lumal/datav/digital-flop';
import '@lumal/datav/style.css';
</script>

<template>
  <LumalBorderBox :variant="8" style="height: 180px">
    <LumalDigitalFlop :value="128" suffix=" 项" />
  </LumalBorderBox>
</template>
