<script setup lang="ts">
import type { NodeSelectedPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { onBeforeUnmount, ref } from 'vue'
import { cockpitTopics } from '../../messages/topics'

/***********************独立应用中性中央组件*********************/
// 不依赖任何地图/三维运行时；仅演示消息联动与生命周期。

const context = useCockpitContext()
const lastNode = ref<string>('')

const unsubscribe = context.messages.subscribe<NodeSelectedPayload>(
  cockpitTopics.nodeSelected,
  (message) => {
    lastNode.value = message.payload?.id ?? ''
  },
)

// 通知模块中央已就绪
context.messages.publish({
  topic: cockpitTopics.centerReady,
  sourceId: context.instanceId,
})

onBeforeUnmount(() => {
  unsubscribe()
})
</script>

<template>
  <div class="standalone-center">
    <p>独立应用中央视图</p>
    <p data-role="last-node">
      最近选择：{{ lastNode || '（无）' }}
    </p>
  </div>
</template>

<style scoped>
.standalone-center {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
