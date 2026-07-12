<script setup lang="ts">
import type { CockpitBaseContext, CockpitCenterInstance } from '../types'
import { computed, onBeforeUnmount } from 'vue'
import { provideCockpitContext } from '../composables/useCockpitContext'
import CockpitErrorBoundary from './CockpitErrorBoundary.vue'
import { useCockpitRuntimeEnv } from './context'
import { resolveCockpitComponent } from './resolveComponent'

/***********************中央组件 Host*********************/
// 渲染中央组件实例：未配置 / 未注册 / 渲染失败均可安全降级。

const props = defineProps<{
  categoryId: string
  pageId: string
  center?: CockpitCenterInstance
}>()

const env = useCockpitRuntimeEnv()

const definition = computed(() =>
  props.center ? env.registry.resolveCenter(props.center.type) : undefined,
)
const resolved = computed(() => {
  const def = definition.value
  return def ? resolveCockpitComponent(def.component) : null
})

const context = computed<CockpitBaseContext | null>(() => {
  if (!props.center)
    return null
  return {
    cockpitId: env.cockpitId,
    categoryId: props.categoryId,
    pageId: props.pageId,
    instanceId: props.center.id,
    mode: env.mode,
    messages: env.messages,
  }
})

const centerNodeId = computed(() => props.center?.id ?? `${props.categoryId}:${props.pageId}:center`)

// 有配置时 per-instance 提供上下文
if (context.value)
  provideCockpitContext(context.value)

onBeforeUnmount(() => {
  if (props.center)
    env.messages.clearInstance(props.center.id)
})
</script>

<template>
  <div
    class="luma-cockpit-center"
    :data-center-type="center?.type"
    data-cockpit-node="center"
    :data-cockpit-node-id="centerNodeId"
  >
    <!-- 未配置中央组件 -->
    <template v-if="!center">
      <component :is="env.slots['empty-center']" v-if="env.slots['empty-center']" />
      <div v-else class="luma-cockpit-center__empty" role="status">
        未配置中央组件
      </div>
    </template>

    <!-- 配置的 type 未注册 -->
    <template v-else-if="!definition">
      <component
        :is="env.slots['missing-center']"
        v-if="env.slots['missing-center']"
        :type="center.type"
        :instance-id="center.id"
      />
      <div v-else class="luma-cockpit-center__missing" role="status">
        未注册中央组件：{{ center.type }}
      </div>
    </template>

    <!-- 已注册：错误边界隔离，预览失败不影响左右布局 -->
    <CockpitErrorBoundary v-else>
      <component :is="resolved" :context="context" />
      <template #error="{ retry }">
        <component
          :is="env.slots.error"
          v-if="env.slots.error"
          :retry="retry"
          :instance-id="center.id"
        />
        <div v-else class="luma-cockpit-center__error" role="alert">
          <span>中央组件加载失败</span>
          <button type="button" @click="retry">
            重试
          </button>
        </div>
      </template>
    </CockpitErrorBoundary>
  </div>
</template>
