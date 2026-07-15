<script setup lang="ts" generic="T extends object">
import type { CSSProperties } from 'vue'
import type {
  DataValueKey,
  ScrollBoardColumn,
  ScrollBoardConfig,
  ScrollBoardEventPayload,
  ScrollBoardRowKey,
} from '../types'
import { computed, shallowRef, useSlots, useTemplateRef, watch } from 'vue'
import { useDataVScrollAnimation } from '../composables/useDataVScrollAnimation'
import { useElementSize } from '../composables/useElementSize'
import { cssSize, positiveInteger, resolveRowKey } from '../utils'

const props = withDefaults(defineProps<{
  config?: ScrollBoardConfig
  rows?: readonly T[]
  rowKey?: ScrollBoardRowKey<T>
  columns?: readonly ScrollBoardColumn<T>[]
  visibleRows?: number
  interval?: number
  step?: number | 'page'
  autoplay?: boolean
  ariaLabel?: string
}>(), {
  ariaLabel: '滚动数据表',
  autoplay: true,
  columns: () => [],
  config: () => ({}),
  interval: undefined,
  rowKey: undefined,
  rows: undefined,
  step: undefined,
  visibleRows: undefined,
})

const emit = defineEmits<{
  click: [payload: ScrollBoardEventPayload]
  mouseover: [payload: ScrollBoardEventPayload]
  rowClick: [row: T, index: number]
}>()

defineSlots<{
  default?: (props: { row: T, index: number }) => unknown
  cell?: (props: { row: T, column: ScrollBoardColumn<T>, value: unknown, rowIndex: number, columnIndex: number }) => unknown
}>()

interface BoardCell {
  index: boolean
  value: unknown
}

interface BoardEntry {
  cells: BoardCell[]
  key: DataValueKey
  modernRow?: T
  rowIndex: number
}

interface RenderEntry extends BoardEntry {
  renderKey: string
  slotIndex: number
}

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const slots = useSlots()
const size = useElementSize(rootRef)
const configData = shallowRef<readonly (readonly unknown[])[]>(props.config.data ?? [])
const configMode = computed(() => props.rows === undefined)
const hasCustomRows = computed(() => !configMode.value && Boolean(slots.default))
const rowCount = computed(() => positiveInteger(props.visibleRows ?? props.config.rowNum ?? 5, 5))
const waitTime = computed(() => Math.max(0, props.interval ?? props.config.waitTime ?? 2000))
const carousel = computed(() => props.step === 'page' ? 'page' : props.config.carousel ?? 'single')
const advanceBy = computed(() => props.step === 'page' || (props.step === undefined && carousel.value === 'page')
  ? rowCount.value
  : positiveInteger(typeof props.step === 'number' ? props.step : 1, 1))
const hoverPause = computed(() => configMode.value ? props.config.hoverPause ?? true : true)

const header = computed(() => {
  if (!configMode.value)
    return props.columns.map(column => column.label)
  const values = [...(props.config.header ?? [])]
  if (values.length && props.config.index)
    values.unshift(props.config.indexHeader ?? '#')
  return values
})

const entries = computed<BoardEntry[]>(() => {
  if (configMode.value) {
    return configData.value.map((row, rowIndex) => {
      const cells: BoardCell[] = row.map(value => ({ index: false, value }))
      if (props.config.index)
        cells.unshift({ index: true, value: rowIndex + 1 })
      return { cells, key: rowIndex, rowIndex }
    })
  }

  return (props.rows ?? []).map((row, rowIndex) => ({
    cells: props.columns.map(column => ({ index: false, value: cellValue(row, column) })),
    key: props.rowKey ? resolveRowKey(row, rowIndex, props.rowKey) : rowIndex,
    modernRow: row,
    rowIndex,
  }))
})

const columnCount = computed(() => entries.value[0]?.cells.length ?? header.value.length)
const widths = computed<Array<number | string | undefined>>(() => {
  if (!configMode.value)
    return props.columns.map(column => column.width)
  const specified = props.config.columnWidth ?? []
  const usedWidth = specified.reduce((total, width) => total + width, 0)
  const unspecified = columnCount.value - specified.length
  const average = unspecified > 0 ? (size.value.width - usedWidth) / unspecified : 0
  return Array.from({ length: columnCount.value }, (_, index) => specified[index] ?? average)
})
const aligns = computed(() => Array.from({ length: columnCount.value }, (_, index) =>
  configMode.value ? props.config.align?.[index] ?? 'left' : props.columns[index]?.align ?? 'left',
))
const headerHeight = computed(() => header.value.length ? Math.max(0, props.config.headerHeight ?? 35) : 0)
const rowsHeight = computed(() => Math.max(0, size.value.height - headerHeight.value))
const averageHeight = computed(() => rowsHeight.value / rowCount.value)

const animation = useDataVScrollAnimation({
  advanceBy,
  element: rootRef,
  enabled: computed(() => props.autoplay && waitTime.value > 0),
  hoverPause,
  rowCount,
  total: computed(() => entries.value.length),
  waitTime,
})

const renderRows = computed<RenderEntry[]>(() => {
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
  const count = configMode.value && carousel.value === 'page' ? rowCount.value * 2 : rowCount.value + 1
  return Array.from({ length: count }, (_, slotIndex) => {
    const index = (animation.renderOffset.value + slotIndex) % source.length
    const entry = source[index]!
    return {
      ...entry,
      renderKey: `${String(entry.key)}-${slotIndex}-${animation.renderOffset.value}`,
      slotIndex,
    }
  })
})

function cellValue(row: T, column: ScrollBoardColumn<T>): unknown {
  return (row as Record<PropertyKey, unknown>)[column.key as PropertyKey]
}

function cellText(entry: RenderEntry, columnIndex: number): string | number {
  const cell = entry.cells[columnIndex]
  if (!cell)
    return ''
  if (configMode.value)
    return typeof cell.value === 'string' || typeof cell.value === 'number' ? cell.value : String(cell.value ?? '')
  const column = props.columns[columnIndex]
  const row = entry.modernRow
  if (!column || !row)
    return ''
  return column.formatter?.(cell.value, row, entry.rowIndex)
    ?? (typeof cell.value === 'string' || typeof cell.value === 'number' ? cell.value : '')
}

function columnStyle(index: number): CSSProperties {
  const width = widths.value[index]
  return {
    flex: width === undefined ? '1 1 0' : '0 0 auto',
    textAlign: aligns.value[index],
    width: cssSize(width),
  }
}

function rowStyle(entry: RenderEntry): CSSProperties {
  const collapseCount = carousel.value === 'page' ? rowCount.value : advanceBy.value
  const height = animation.collapsing.value && entry.slotIndex < collapseCount ? 0 : averageHeight.value
  const backgroundColor = entry.rowIndex % 2 === 0
    ? props.config.evenRowBGC ?? '#0A2732'
    : props.config.oddRowBGC ?? '#003B51'
  return {
    backgroundColor,
    height: `${height}px`,
    lineHeight: `${height}px`,
  }
}

function configPayload(entry: RenderEntry, columnIndex: number): ScrollBoardEventPayload {
  const row = entry.cells.map(cell => cell.value)
  return {
    ceil: row[columnIndex],
    columnIndex,
    row,
    rowIndex: entry.rowIndex,
  }
}

function handleCellClick(entry: RenderEntry, columnIndex: number): void {
  if (configMode.value)
    emit('click', configPayload(entry, columnIndex))
}

function handleCellEnter(entry: RenderEntry, columnIndex: number): void {
  if (configMode.value)
    emit('mouseover', configPayload(entry, columnIndex))
  animation.onMouseEnter()
}

function handleRowClick(entry: RenderEntry): void {
  if (!configMode.value && entry.modernRow)
    emit('rowClick', entry.modernRow, entry.rowIndex)
}

function onRowKeydown(event: KeyboardEvent, entry: RenderEntry): void {
  if (configMode.value || hasCustomRows.value || event.target !== event.currentTarget || !['Enter', ' '].includes(event.key))
    return
  event.preventDefault()
  handleRowClick(entry)
}

function updateRows(rows: readonly (readonly unknown[])[], animationIndex?: number): void {
  configData.value = rows.map(row => [...row])
  animation.reset(typeof animationIndex === 'number' ? animationIndex : animation.renderOffset.value)
}

watch(() => props.config.data, (rows) => {
  configData.value = (rows ?? []).map(row => [...row])
  animation.reset(0)
})
watch(() => props.rows, () => animation.reset(0))
watch(() => props.config, () => animation.reset(0))

defineExpose({ updateRows })
</script>

<template>
  <div
    ref="rootRef"
    class="dv-scroll-board luma-scroll-board"
    :class="{ 'is-animation-paused': animation.paused.value }"
    :role="hasCustomRows ? 'list' : 'table'"
    :data-mode="hasCustomRows ? 'list' : 'table'"
    :aria-label="ariaLabel"
    @mouseenter="!configMode && animation.onMouseEnter()"
    @mouseleave="!configMode && animation.onMouseLeave()"
    @focusin="animation.onFocusIn"
    @focusout="animation.onFocusOut"
  >
    <div
      v-if="header.length"
      class="header luma-scroll-board__header"
      role="row"
      :style="{ backgroundColor: config.headerBGC ?? '#00BAFF' }"
    >
      <div
        v-for="(headerItem, index) in header"
        :key="`${headerItem}-${index}`"
        class="header-item"
        role="columnheader"
        :align="aligns[index]"
        :style="{ ...columnStyle(index), height: `${headerHeight}px`, lineHeight: `${headerHeight}px` }"
      >{{ headerItem }}</div>
    </div>

    <div class="rows luma-scroll-board__viewport" :style="{ height: `${rowsHeight}px` }">
      <div
        v-for="entry in renderRows"
        :key="entry.renderKey"
        class="row-item luma-scroll-board__row"
        :role="hasCustomRows ? 'listitem' : 'row'"
        :style="rowStyle(entry)"
        :tabindex="configMode || hasCustomRows ? undefined : 0"
        @click="handleRowClick(entry)"
        @keydown="onRowKeydown($event, entry)"
        @mouseenter="!configMode && animation.onMouseEnter()"
        @mouseleave="animation.onMouseLeave"
      >
        <div v-if="hasCustomRows && entry.modernRow" class="ceil luma-scroll-board__slot">
          <slot :row="entry.modernRow" :index="entry.rowIndex" />
        </div>
        <div
          v-for="(cell, columnIndex) in entry.cells"
          v-else
          :key="columnIndex"
          class="ceil luma-scroll-board__cell"
          role="cell"
          :align="aligns[columnIndex]"
          :style="columnStyle(columnIndex)"
          @click="handleCellClick(entry, columnIndex)"
          @mouseenter="handleCellEnter(entry, columnIndex)"
          @mouseleave="animation.onMouseLeave"
        >
          <span
            v-if="cell.index"
            class="index"
            :style="{ backgroundColor: config.headerBGC ?? '#00BAFF' }"
          >{{ cell.value }}</span>
          <slot
            v-else-if="!configMode && entry.modernRow && columns[columnIndex]"
            name="cell"
            :row="entry.modernRow"
            :column="columns[columnIndex]!"
            :value="cell.value"
            :row-index="entry.rowIndex"
            :column-index="columnIndex"
          >{{ cellText(entry, columnIndex) }}</slot>
          <template v-else>{{ cellText(entry, columnIndex) }}</template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv-scroll-board.luma-scroll-board {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: #fff;
}

.dv-scroll-board .header {
  display: flex;
  flex-direction: row;
  font-size: 15px;
}

.dv-scroll-board .header-item,
.dv-scroll-board .ceil {
  box-sizing: border-box;
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-scroll-board .header-item,
.dv-scroll-board .row-item {
  transition: all 0.3s;
}

.dv-scroll-board .rows {
  display: block;
  overflow: hidden;
}

.dv-scroll-board .row-item {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  font-size: 14px;
  border: 0;
}

.dv-scroll-board .ceil {
  display: block;
  height: 100%;
}

.dv-scroll-board .luma-scroll-board__slot {
  width: 100%;
  padding: 0;
}

.dv-scroll-board .index {
  padding: 0 3px;
  border-radius: 3px;
}

.dv-scroll-board[data-mode="table"] .row-item {
  cursor: pointer;
}

.dv-scroll-board[data-mode="table"] .row-item:focus-visible {
  outline: 2px solid var(--luma-datav-focus-ring, #35c8ff);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .dv-scroll-board .header-item,
  .dv-scroll-board .row-item {
    transition-duration: 0.01ms;
  }
}
</style>
