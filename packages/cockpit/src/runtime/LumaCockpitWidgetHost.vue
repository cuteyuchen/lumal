<script setup lang="ts">
import type { CockpitBaseContext, CockpitWidgetInstance } from '../types'
import { computed, onBeforeUnmount } from 'vue'
import { provideCockpitContext } from '../composables/useCockpitContext'
import CockpitErrorBoundary from './CockpitErrorBoundary.vue'
import { useCockpitRuntimeEnv } from './context'
import { resolveCockpitComponent } from './resolveComponent'

/***********************业务模块 Host*********************/
// 渲染单个模块实例：per-instance 上下文、缺失降级、卸载清理订阅。

const props = defineProps<{
  categoryId: string
  pageId: string
  side: 'left' | 'right'
  widget: CockpitWidgetInstance
}>()

const env = useCockpitRuntimeEnv()

const definition = computed(() => env.registry.resolveWidget(props.widget.type))
const resolved = computed(() => {
  const def = definition.value
  return def ? resolveCockpitComponent(def.component) : null
})

const context = computed<CockpitBaseContext>(() => ({
  cockpitId: env.cockpitId,
  categoryId: props.categoryId,
  pageId: props.pageId,
  instanceId: props.widget.id,
  mode: env.mode,
  messages: env.messages,
}))

// per-instance 提供上下文，相同 type 的多实例各自独立
provideCockpitContext(context.value)

// 卸载时清理该实例遗留的消息订阅
onBeforeUnmount(() => {
  env.messages.clearInstance(props.widget.id)
})

const title = computed(() => props.widget.title)
</script>

<template>
  <section
    class="luma-cockpit-widget"
    :data-widget-type="widget.type"
    :data-instance-id="widget.id"
    data-cockpit-node="widget"
    :data-cockpit-node-id="widget.id"
    :data-cockpit-side="side"
  >
    <header v-if="title || env.slots['widget-title']" class="luma-cockpit-widget__title">
      <component
        :is="env.slots['widget-title']"
        v-if="env.slots['widget-title']"
        :widget="widget"
        :title="title"
      />
      <span v-else>{{ title }}</span>
    </header>

    <div class="luma-cockpit-widget__body">
      <!-- 未注册 type：缺失占位，不使整个驾驶舱崩溃 -->
      <template v-if="!definition">
        <component
          :is="env.slots['missing-widget']"
          v-if="env.slots['missing-widget']"
          :type="widget.type"
          :instance-id="widget.id"
        />
        <div v-else class="luma-cockpit-widget__missing" role="status">
          未注册模块：{{ widget.type }}
        </div>
      </template>

      <!-- 已注册：错误边界隔离渲染，异步加载失败可重试 -->
      <CockpitErrorBoundary v-else>
        <component :is="resolved" :context="context" />
        <template #error="{ retry }">
          <component
            :is="env.slots.error"
            v-if="env.slots.error"
            :retry="retry"
            :instance-id="widget.id"
          />
          <div v-else class="luma-cockpit-widget__error" role="alert">
            <span>模块加载失败</span>
            <button type="button" @click="retry">
              重试
            </button>
          </div>
        </template>
      </CockpitErrorBoundary>
    </div>
  </section>
</template>
