<script setup lang="ts">
import type { CenterSelectionChangedPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { onBeforeUnmount, ref } from 'vue'
import {

  cockpitTopics,
} from '../../messages/topics'

/***********************中性业务模块示例*********************/
// 演示通过消息总线与中央组件双向联动，不含任何行业业务。

const context = useCockpitContext()
const lastFromCenter = ref<string>('')

// 订阅中央组件的选择变化（定向到本实例或广播）
const unsubscribe = context.messages.subscribe<CenterSelectionChangedPayload>(
  cockpitTopics.centerSelectionChanged,
  (message) => {
    lastFromCenter.value = message.payload?.id ?? ''
  },
)

function selectItem(id: string): void {
  context.messages.publish({
    topic: cockpitTopics.businessItemSelected,
    sourceId: context.instanceId,
    payload: { id, label: `项 ${id}` },
  })
}

onBeforeUnmount(() => {
  unsubscribe()
})
</script>

<template>
  <div class="stub-widget" :data-instance-id="context.instanceId">
    <p class="stub-widget__hint">
      业务模块示例（实例 {{ context.instanceId }}）
    </p>
    <div class="stub-widget__actions">
      <button
        v-for="id in ['1', '2', '3']"
        :key="id"
        type="button"
        :data-action="`select-item-${id}`"
        @click="selectItem(id)"
      >
        选择 {{ id }}
      </button>
    </div>
    <p class="stub-widget__feedback" data-role="from-center">
      来自中央：{{ lastFromCenter || '（无）' }}
    </p>
  </div>
</template>

<style scoped>
.stub-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  height: 100%;
  box-sizing: border-box;
}

.stub-widget__actions {
  display: flex;
  gap: 8px;
}

.stub-widget__actions button {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
}
</style>
