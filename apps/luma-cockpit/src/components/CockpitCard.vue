<script setup lang="ts">
import type { CockpitCardProps, CockpitCardTab } from '@luma/cockpit'
import { LumaCockpitCard } from '@luma/cockpit/runtime'

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
</script>

<template>
  <LumaCockpitCard
    class="standalone-cockpit-card"
    :title="props.title"
    :widget="props.widget"
    :tabs="props.tabs"
    :active-tab-id="props.activeTabId"
    @update:active-tab-id="handleActiveTabIdUpdate"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>

    <template v-if="slots.title" #title="slotProps">
      <slot name="title" v-bind="slotProps" />
    </template>

    <template v-if="slots.tab" #tab="slotProps">
      <slot name="tab" v-bind="slotProps" />
    </template>
  </LumaCockpitCard>
</template>
