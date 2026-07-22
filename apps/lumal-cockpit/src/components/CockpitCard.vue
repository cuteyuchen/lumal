<script setup lang="ts">
import type { CockpitCardProps, CockpitCardTab } from '@lumal/cockpit'
import { LumalCockpitCard } from '@lumal/cockpit/runtime'

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
</script>

<template>
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
</template>

<style scoped>
.standalone-cockpit-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
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

.standalone-cockpit-card__title-content > span,
.standalone-cockpit-card__tab-content > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.standalone-cockpit-card__title-content small,
.standalone-cockpit-card__tab-content small {
  margin-left: auto;
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
