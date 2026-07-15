<script setup lang="ts" generic="T">
import type { CSSProperties } from 'vue'
import type {
  RankingItem,
  ScrollRankingBoardConfig,
  ScrollRankingComputedItem,
  ScrollRankingDataItem,
} from '../types'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { useDataVScrollAnimation } from '../composables/useDataVScrollAnimation'
import { itemColor, positiveInteger } from '../utils'

const props = withDefaults(defineProps<{
  config?: ScrollRankingBoardConfig<T>
  items?: readonly RankingItem<T>[]
  visibleRows?: number
  interval?: number
  autoplay?: boolean
  sort?: false | 'asc' | 'desc'
  unit?: string
  formatter?: (value: number, item: RankingItem<T>, index: number) => string | number
  ariaLabel?: string
}>(), {
  ariaLabel: '滚动排名',
  autoplay: true,
  config: () => ({}),
  formatter: undefined,
  interval: undefined,
  items: undefined,
  sort: undefined,
  unit: undefined,
  visibleRows: undefined,
})

defineSlots<{
  default?: (props: { item: RankingItem<T>, index: number, ratio: number }) => unknown
}>()

interface RankingEntry {
  computedItem?: ScrollRankingComputedItem<T>
  item: RankingItem<T>
  key: string | number
  percent: number
  ranking: number
  sourceIndex: number
  value: number
}

interface RenderEntry extends RankingEntry {
  renderKey: string
  slotIndex: number
}

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const configData = shallowRef<readonly ScrollRankingDataItem<T>[]>(props.config.data ?? [])
const configMode = computed(() => props.items === undefined)
const rowCount = computed(() => positiveInteger(props.visibleRows ?? props.config.rowNum ?? 5, 5))
const waitTime = computed(() => Math.max(0, props.interval ?? props.config.waitTime ?? 2000))
const carousel = computed(() => props.config.carousel ?? 'single')
const advanceBy = computed(() => carousel.value === 'page' ? rowCount.value : 1)
const unit = computed(() => props.unit ?? props.config.unit ?? '')

const entries = computed<RankingEntry[]>(() => {
  if (!configMode.value) {
    const source = [...(props.items ?? [])]
    const sort = props.sort ?? 'desc'
    if (sort)
      source.sort((left, right) => sort === 'asc' ? left.value - right.value : right.value - left.value)
    const maximum = Math.max(1, ...source.map(item => Math.max(0, item.value)))
    return source.map((item, sourceIndex) => ({
      item,
      key: item.key,
      percent: Math.min(100, Math.max(0, item.value / maximum * 100)),
      ranking: sourceIndex + 1,
      sourceIndex,
      value: item.value,
    }))
  }

  const source = configData.value.map(item => ({ ...item }))
  if (props.config.sort ?? true)
    source.sort((left, right) => right.value - left.value)
  const values = source.map(item => item.value)
  const minimum = values.length ? Math.min(...values) : 0
  const maximum = values.length ? Math.max(...values) : 0
  const minimumAbsolute = Math.abs(minimum)
  const total = maximum + minimumAbsolute
  return source.map((sourceItem, sourceIndex) => {
    const percent = total ? (sourceItem.value + minimumAbsolute) / total * 100 : 0
    const computedItem: ScrollRankingComputedItem<T> = {
      ...sourceItem,
      percent,
      ranking: sourceIndex + 1,
      scroll: sourceIndex,
    }
    return {
      computedItem,
      item: {
        data: sourceItem.data,
        key: typeof sourceItem.key === 'string' || typeof sourceItem.key === 'number'
          ? sourceItem.key
          : `${sourceItem.name}-${sourceIndex}`,
        label: sourceItem.name,
        value: sourceItem.value,
      },
      key: `${sourceItem.name}-${sourceIndex}`,
      percent,
      ranking: sourceIndex + 1,
      sourceIndex,
      value: sourceItem.value,
    }
  })
})

const animation = useDataVScrollAnimation({
  advanceBy,
  element: rootRef,
  enabled: computed(() => props.autoplay && waitTime.value > 0),
  hoverPause: computed(() => true),
  rowCount,
  total: computed(() => entries.value.length),
  waitTime,
})

const renderItems = computed<RenderEntry[]>(() => {
  const source = entries.value
  if (!source.length)
    return []
  if (source.length <= rowCount.value) {
    return source.map((entry, slotIndex) => ({
      ...entry,
      renderKey: `${String(entry.key)}-${slotIndex}`,
      slotIndex,
    }))
  }
  return Array.from({ length: rowCount.value + 1 }, (_, slotIndex) => {
    const index = (animation.renderOffset.value + slotIndex) % source.length
    const entry = source[index]!
    return {
      ...entry,
      renderKey: `${String(entry.key)}-${slotIndex}-${animation.renderOffset.value}`,
      slotIndex,
    }
  })
})

const averageHeight = computed(() => 100 / rowCount.value)

function ratio(entry: RankingEntry): number {
  return Math.min(1, Math.max(0, entry.percent / 100))
}

function rowStyle(entry: RenderEntry): CSSProperties {
  const collapseCount = carousel.value === 'page' ? rowCount.value : 1
  const height = animation.collapsing.value && entry.slotIndex < collapseCount ? 0 : averageHeight.value
  const color = configMode.value ? '#1370fb' : itemColor(entry.item, entry.sourceIndex)
  return {
    '--luma-ranking-color': color,
    '--luma-ranking-ratio': ratio(entry),
    height: `${height}%`,
  } as CSSProperties
}

function formattedValue(entry: RankingEntry): string | number {
  if (configMode.value && props.config.valueFormatter && entry.computedItem)
    return props.config.valueFormatter(entry.computedItem)
  return props.formatter?.(entry.value, entry.item, entry.sourceIndex) ?? `${entry.value}${unit.value}`
}

watch(() => props.config.data, (items) => {
  configData.value = (items ?? []).map(item => ({ ...item }))
  animation.reset(0)
})
watch(() => props.items, () => animation.reset(0))
watch(() => props.config, () => animation.reset(0))
</script>

<template>
  <div
    ref="rootRef"
    class="dv-scroll-ranking-board luma-scroll-ranking-board"
    :class="{ 'is-animation-paused': animation.paused.value }"
    role="list"
    :aria-label="ariaLabel"
    @mouseenter="animation.onMouseEnter"
    @mouseleave="animation.onMouseLeave"
    @focusin="animation.onFocusIn"
    @focusout="animation.onFocusOut"
  >
    <div class="luma-scroll-ranking-board__viewport">
      <div
        v-for="entry in renderItems"
        :key="entry.renderKey"
        class="row-item luma-scroll-ranking-board__row"
        role="listitem"
        :style="rowStyle(entry)"
      >
        <div class="luma-scroll-ranking-board__slot">
          <slot :item="entry.item" :index="entry.sourceIndex" :ratio="ratio(entry)">
            <div class="ranking-info luma-scroll-ranking-board__summary">
              <div class="rank luma-scroll-ranking-board__rank">No.{{ entry.ranking }}</div>
              <div class="info-name luma-scroll-ranking-board__label">{{ entry.item.label }}</div>
              <div class="ranking-value"><strong>{{ formattedValue(entry) }}</strong></div>
            </div>
            <div class="ranking-column luma-scroll-ranking-board__track" aria-hidden="true">
              <div class="inside-column" :style="{ width: `${entry.percent}%` }">
                <div class="shine" />
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv-scroll-ranking-board.luma-scroll-ranking-board {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  color: #fff;
}

.dv-scroll-ranking-board .luma-scroll-ranking-board__viewport {
  display: block;
  height: 100%;
  overflow: hidden;
}

.dv-scroll-ranking-board .row-item {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s;
}

.dv-scroll-ranking-board .luma-scroll-ranking-board__slot {
  display: block;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
}

.dv-scroll-ranking-board .ranking-info {
  display: flex;
  width: 100%;
  font-size: 13px;
}

.dv-scroll-ranking-board .rank {
  display: block;
  width: 40px;
  height: auto;
  color: var(--luma-ranking-color);
  background: transparent;
  border-radius: 0;
  font: inherit;
}

.dv-scroll-ranking-board .info-name {
  color: inherit;
  flex: 1;
  font-size: inherit;
}

.dv-scroll-ranking-board .ranking-value strong {
  font: inherit;
}

.dv-scroll-ranking-board .ranking-column {
  display: block;
  height: auto;
  margin-top: 5px;
  overflow: visible;
  background: transparent;
  border-bottom: 2px solid color-mix(in srgb, var(--luma-ranking-color) 50%, transparent);
  border-radius: 0;
}

.dv-scroll-ranking-board .inside-column {
  position: relative;
  height: 6px;
  margin-bottom: 2px;
  overflow: hidden;
  background-color: var(--luma-ranking-color);
  border-radius: 1px;
}

.dv-scroll-ranking-board .shine {
  position: absolute;
  top: 2px;
  left: 0%;
  width: 50px;
  height: 2px;
  background: radial-gradient(rgb(40 248 255) 5%, transparent 80%);
  transform: translateX(-100%);
  animation: luma-ranking-shine 3s ease-in-out infinite alternate;
}

.dv-scroll-ranking-board.is-animation-paused .shine {
  animation-play-state: paused;
}

@keyframes luma-ranking-shine {
  80% {
    left: 0%;
    transform: translateX(-100%);
  }

  100% {
    left: 100%;
    transform: translateX(0%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dv-scroll-ranking-board .row-item {
    transition-duration: 0.01ms;
  }

  .dv-scroll-ranking-board .shine {
    animation: none;
  }
}
</style>
