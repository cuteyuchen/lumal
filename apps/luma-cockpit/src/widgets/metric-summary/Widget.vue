<script setup lang="ts">
import { LumaDigitalFlop, LumaPercentPond } from '@luma/datav'
import { computed } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { metricSummaries } from '../../data/demo-scene'

/***********************核心运行指标模块*********************/

const loading = false
const error = ''
const items = computed(() => metricSummaries)
</script>

<template>
  <div class="metric-summary">
    <WidgetState :loading="loading" :error="error" :empty="items.length === 0" />
    <dl v-if="!loading && !error && items.length > 0" class="metric-summary__grid">
      <div
        v-for="(item, index) in items"
        :key="item.label"
        class="metric-summary__item"
        :data-tone="item.tone"
      >
        <dt class="metric-summary__heading">
          <span>{{ item.label }}</span>
          <span>0{{ index + 1 }}</span>
        </dt>
        <dd class="metric-summary__value">
          <span v-if="item.visual === 'percent'" class="metric-summary__pond-value">
            <LumaPercentPond
              :value="item.value"
              :colors="['var(--metric-tone)', 'var(--luma-cockpit-accent)']"
              :aria-label="`${item.label} ${item.value}%`"
            />
          </span>
          <LumaDigitalFlop v-else :value="item.value" :duration="420" />
          <span>{{ item.unit }}</span>
        </dd>
        <dd class="metric-summary__trend">
          {{ item.trend }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.metric-summary {
  height: 100%;
}

.metric-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  height: 100%;
  margin: 0;
}

.metric-summary__item {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 82px;
  padding: 10px 11px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 28%);
  border-radius: 2px;
  background:
    linear-gradient(180deg, var(--metric-tone, var(--luma-cockpit-accent)), transparent) right bottom / 1px 22px no-repeat,
    linear-gradient(90deg, var(--metric-tone, var(--luma-cockpit-accent)), transparent) right bottom / 22px 1px no-repeat,
    linear-gradient(135deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 89%), transparent 48%),
    color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 18%);
  box-shadow: inset 0 0 18px color-mix(in srgb, var(--luma-cockpit-accent), transparent 94%);
}

.metric-summary__item::before,
.metric-summary__item::after {
  position: absolute;
  content: '';
}

.metric-summary__item::before {
  top: 0;
  left: 0;
  width: 36px;
  height: 2px;
  background: linear-gradient(90deg, var(--metric-tone, var(--luma-cockpit-accent)), transparent);
}

.metric-summary__item::after {
  top: 0;
  left: 0;
  width: 2px;
  height: 30px;
  background: linear-gradient(180deg, var(--metric-tone, var(--luma-cockpit-accent)), transparent);
}

.metric-summary__item[data-tone='green'] {
  --metric-tone: var(--luma-cockpit-success);
}

.metric-summary__item[data-tone='amber'] {
  --metric-tone: var(--luma-cockpit-warning);
}

.metric-summary__item[data-tone='blue'] {
  --metric-tone: #4e8dff;
}

.metric-summary__heading,
.metric-summary__value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-summary__heading > span:first-child {
  color: var(--luma-cockpit-text-secondary);
  font-size: 11px;
}

.metric-summary__heading span {
  color: color-mix(in srgb, var(--metric-tone, var(--luma-cockpit-accent)), transparent 38%);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.metric-summary__value {
  align-items: end;
  justify-content: flex-start;
  margin: 4px 0 0;
  color: var(--metric-tone, var(--luma-cockpit-accent));
  font-size: 27px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: 0 0 12px color-mix(in srgb, var(--metric-tone, var(--luma-cockpit-accent)), transparent 54%);
}

.metric-summary__pond-value {
  width: min(100%, 136px);
  min-width: 0;
  font-size: 12px !important;
  text-shadow: none !important;
}

.metric-summary__pond-value :deep(.luma-percent-pond) {
  width: 100%;
}

.metric-summary__value span {
  margin-bottom: 2px;
  color: var(--luma-cockpit-text-muted);
  font-size: 10px;
}

.metric-summary__trend {
  margin: 4px 0 0;
  color: var(--luma-cockpit-text-muted);
  font-size: 10px;
}
</style>
