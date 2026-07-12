<script setup lang="ts">
import type { BusinessItemSelectedPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { onBeforeUnmount, ref } from 'vue'
import {

  cockpitTopics,
} from '../../messages/topics'

/***********************中性中央组件示例*********************/
// 演示中央组件与业务模块的双向联动，不依赖任何地图或三维运行时。

const context = useCockpitContext()
const lastSelected = ref<string>('')

// 订阅业务模块的选择事件
const unsubscribe = context.messages.subscribe<BusinessItemSelectedPayload>(
  cockpitTopics.businessItemSelected,
  (message) => {
    lastSelected.value = message.payload?.id ?? ''
  },
)

// 向业务模块广播中央区域的选择变化
function emitSelection(id: string): void {
  context.messages.publish({
    topic: cockpitTopics.centerSelectionChanged,
    sourceId: context.instanceId,
    payload: { id, source: 'stub-center' },
  })
}

onBeforeUnmount(() => {
  unsubscribe()
})
</script>

<template>
  <div class="stub-center" :data-instance-id="context.instanceId">
    <p class="stub-center__hint">
      中央组件示例（模式：{{ context.mode }}）
    </p>
    <p class="stub-center__feedback" data-role="from-widget">
      来自模块：{{ lastSelected || '（无）' }}
    </p>
    <div class="stub-center__actions">
      <button
        v-for="id in ['A', 'B']"
        :key="id"
        type="button"
        :data-action="`center-select-${id}`"
        @click="emitSelection(id)"
      >
        广播 {{ id }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.stub-center {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.stub-center__actions {
  display: flex;
  gap: 8px;
}

.stub-center__actions button {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
}
</style>
