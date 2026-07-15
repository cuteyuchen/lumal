<script setup lang="ts">
import { useCockpitContext } from '@luma/cockpit'
import { cockpitTopics } from '../../messages/topics'

/***********************独立应用中性业务模块*********************/

const context = useCockpitContext()

function selectNode(id: string): void {
  context.messages.publish({
    topic: cockpitTopics.nodeSelected,
    sourceId: context.instanceId,
    payload: { id },
  })
}
</script>

<template>
  <div class="standalone-widget">
    <p>独立业务模块（{{ context.instanceId }}）</p>
    <div class="standalone-widget__actions">
      <button
        v-for="id in ['n1', 'n2']"
        :key="id"
        type="button"
        :data-action="`select-${id}`"
        @click="selectNode(id)"
      >
        {{ id }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.standalone-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.standalone-widget__actions {
  display: flex;
  gap: 8px;
}

.standalone-widget__actions button {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
}
</style>
