<script setup lang="ts">
import type { CockpitCardProps, CockpitCardTab } from '@lumal/cockpit'
import type { BorderBoxVariant } from '@lumal/datav'
import { LumalCockpitCard } from '@lumal/cockpit/runtime'
import { LumalBorderBox, LumalDecoration } from '@lumal/datav'
import { computed } from 'vue'

const props = defineProps<CockpitCardProps>()

const emit = defineEmits<{
  'update:activeTabId': [activeTabId: string]
}>()

const slots = defineSlots<{
  default: (props: { activeTabId: string | undefined }) => unknown
  title: (props: { title: string | undefined, widget: CockpitCardProps['widget'] }) => unknown
  tab: (props: { tab: CockpitCardTab, active: boolean }) => unknown
}>()

function handleActiveTabIdUpdate(activeTabId: string): void {
  emit('update:activeTabId', activeTabId)
}

const widgetCodes: Record<string, string> = {
  'metric-summary': 'OPS 01',
  'trend-panel': 'TREND 02',
  'status-distribution': 'STATE 03',
  'event-list': 'ALERT 04',
  'region-ranking': 'RANK 05',
  'node-pulse': 'NODE 06',
  'capacity-monitor': 'FLOW 07',
}

function widgetCode(type?: string): string {
  return type ? widgetCodes[type] ?? 'DATA SYS' : 'DATA SYS'
}

/***********************DataV 边框皮肤*********************/

// 按模块类型分配边框样式：核心指标与告警用带流光的 8/9，
// 其余用较安静的 13，避免整屏动画过密。
const BORDER_VARIANTS: Record<string, BorderBoxVariant> = {
  'metric-summary': 9,
  'event-list': 8,
  'trend-panel': 13,
  'status-distribution': 13,
  'region-ranking': 13,
  'node-pulse': 13,
  'capacity-monitor': 13,
}

// tabs 卡片以首个 tab 的类型定调，切换 tab 时边框不跳变。
const borderVariant = computed<BorderBoxVariant>(() => {
  const type = props.widget?.type ?? props.tabs?.[0]?.widget.type
  return (type ? BORDER_VARIANTS[type] : undefined) ?? 13
})

// LumalBorderBox 的 colors 是 prop 而非 CSS 变量，无法直接吃主题变量，
// 这里固定为暗色系描边色，与 styles/index.css 的 accent 取色保持一致。
const BORDER_COLORS: [string, string] = ['#24d8ee', '#1c5f86']
const DECORATION_COLORS: [string, string] = ['#24d8ee', 'rgba(36, 216, 238, 0.18)']
</script>

<template>
  <LumalBorderBox
    class="standalone-cockpit-card__frame"
    :variant="borderVariant"
    :colors="BORDER_COLORS"
    background="transparent"
  >
    <LumalCockpitCard
      class="standalone-cockpit-card"
      :title="props.title"
      :widget="props.widget"
      :tabs="props.tabs"
      :active-tab-id="props.activeTabId"
      :data-widget-type="props.widget?.type"
      @update:active-tab-id="handleActiveTabIdUpdate"
    >
      <template #default="slotProps">
        <slot v-bind="slotProps" />
      </template>

      <template #title="slotProps">
        <slot v-if="slots.title" name="title" v-bind="slotProps" />
        <span v-else class="standalone-cockpit-card__title-content">
          <i aria-hidden="true" />
          <span>{{ slotProps.title }}</span>
          <LumalDecoration
            class="standalone-cockpit-card__title-decoration"
            :variant="10"
            :colors="DECORATION_COLORS"
          />
          <small>{{ widgetCode(slotProps.widget?.type) }}</small>
        </span>
      </template>

      <template #tab="slotProps">
        <slot v-if="slots.tab" name="tab" v-bind="slotProps" />
        <span v-else class="standalone-cockpit-card__tab-content">
          <span>{{ slotProps.tab.title }}</span>
          <small>{{ widgetCode(slotProps.tab.widget.type) }}</small>
        </span>
      </template>
    </LumalCockpitCard>
  </LumalBorderBox>
</template>

<style scoped>
.standalone-cockpit-card__frame {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

/* 卡片内容默认铺满 border-box 并带不透明底色，会盖住 SVG 描边；
   内缩留出描边与边角装饰的绘制空间。 */
.standalone-cockpit-card__frame :deep(.lumal-border-box__content) {
  padding: 7px;
}

.standalone-cockpit-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 6px;
}

.standalone-cockpit-card__title-content,
.standalone-cockpit-card__tab-content {
  display: inline-flex;
  min-width: 0;
  align-items: center;
}

.standalone-cockpit-card__title-content {
  width: 100%;
  gap: 9px;
}

.standalone-cockpit-card__title-content > i {
  width: 3px;
  height: 16px;
  border-radius: 999px;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  flex: none;
}

/* 标题与代号之间的流动点阵装饰，需显式尺寸——装饰件靠容器撑开。 */
.standalone-cockpit-card__title-decoration {
  width: 48px;
  height: 14px;
  margin-left: auto;
  flex: none;
  opacity: 0.7;
}

.standalone-cockpit-card__title-content > span,
.standalone-cockpit-card__tab-content > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standalone-cockpit-card__title-content small,
.standalone-cockpit-card__tab-content small {
  color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 42%);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.13em;
  white-space: nowrap;
}

.standalone-cockpit-card__tab-content {
  gap: 7px;
}

.standalone-cockpit-card__tab-content small {
  margin-left: 0;
  opacity: 0.56;
}
</style>
