<script setup lang="ts">
import type { CockpitBaseContext, CockpitWidgetInstance } from '../types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton } from 'element-plus'
import { computed, onBeforeUnmount, shallowReactive, watchEffect } from 'vue'
import { provideCockpitContext } from '../composables/useCockpitContext'
import CockpitErrorBoundary from './CockpitErrorBoundary.vue'
import { useCockpitRuntimeEnv } from './context'
import { resolveCockpitComponent } from './resolveComponent'

/***********************业务模块 Host*********************/
// 渲染单个模块实例：per-instance 上下文、缺失降级、卸载清理订阅。

const props = defineProps<{
  layoutId: string
  side: 'left' | 'right'
  widget: CockpitWidgetInstance
  embedded?: boolean
}>()

const env = useCockpitRuntimeEnv()

const definition = computed(() => env.registry.resolveWidget(props.widget.type))
const resolved = computed(() => {
  const def = definition.value
  return def ? resolveCockpitComponent(def.component) : null
})

const context = shallowReactive<CockpitBaseContext>({
  cockpitId: env.cockpitId,
  layoutId: props.layoutId,
  instanceId: props.widget.id,
  mode: env.mode,
  messages: env.messages,
})

watchEffect(() => {
  context.cockpitId = env.cockpitId
  context.layoutId = props.layoutId
  context.instanceId = props.widget.id
  context.mode = env.mode
  context.messages = env.messages
})

// per-instance 提供上下文，相同 type 的多实例各自独立
provideCockpitContext(context)

// 卸载时清理该实例遗留的消息订阅
onBeforeUnmount(() => {
  env.messages.clearInstance(props.widget.id)
})

const title = computed(() => props.widget.title ?? definition.value?.label ?? props.widget.type)
const cardComponent = computed(() => props.embedded ? 'div' : env.cardComponent)
const cardProps = computed(() => props.embedded
  ? { class: 'lumal-cockpit-widget__embedded' }
  : { title: title.value, widget: props.widget })
</script>

<template>
  <section
    class="lumal-cockpit-widget"
    :data-widget-type="widget.type"
    :data-instance-id="widget.id"
    data-cockpit-node="widget"
    :data-cockpit-node-id="widget.id"
    :data-cockpit-side="side"
  >
    <component :is="cardComponent" v-bind="cardProps">
      <template v-if="!embedded && env.slots['widget-title']" #title>
        <component :is="env.slots['widget-title']" :widget="widget" :title="title" />
      </template>

      <div class="lumal-cockpit-widget__body">
        <!-- 未注册 type：缺失占位，不使整个驾驶舱崩溃 -->
        <template v-if="!definition">
          <component
            :is="env.slots['missing-widget']"
            v-if="env.slots['missing-widget']"
            :type="widget.type"
            :instance-id="widget.id"
          />
          <div v-else class="lumal-cockpit-widget__missing" role="status">
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
            <div v-else class="lumal-cockpit-widget__error" role="alert">
              <span>模块加载失败</span>
              <ElButton text type="primary" @click="retry">
                <LumalIcon name="lumal:refresh" :size="14" />
                重试
              </ElButton>
            </div>
          </template>
        </CockpitErrorBoundary>
      </div>
    </component>
  </section>
</template>
