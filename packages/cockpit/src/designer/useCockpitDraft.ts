import type { ComputedRef, Ref } from 'vue'
import type { CockpitValidationResult } from '../config'
import type {
  CockpitConfig,
  CockpitGridCellConfig,
  CockpitGridRowConfig,
  CockpitLayoutConfig,
  CockpitRegionConfig,
  CockpitSide,
  CockpitWidgetInstance,
} from '../types'
import { computed, ref, shallowRef, triggerRef } from 'vue'
import {
  createGridCell,
  createGridColumn,
  createGridRow,
  createLayout,
  createWidgetInstance,
  equalizeRegionColumns,
  normalizeCockpitConfig,
  validateCockpitConfig,
} from '../config'

/***********************布局草稿状态机*********************/

export interface DraftSelection {
  layoutId?: string
}

export type DraftWidgetLocation
  = | { kind: 'cell', side: CockpitSide, rowId: string, cellId: string }
    | { kind: 'tabs', side: CockpitSide, rowId: string, widgetId?: string }

export interface MoveWidgetResult {
  moved: boolean
  requiresReplace: boolean
}

export interface UseCockpitDraftReturn {
  draft: Ref<CockpitConfig>
  selection: Ref<DraftSelection>
  layouts: ComputedRef<CockpitLayoutConfig[]>
  activeLayout: ComputedRef<CockpitLayoutConfig | undefined>
  addLayout: () => void
  duplicateLayout: (id: string) => void
  removeLayout: (id: string) => boolean
  renameLayout: (id: string, title: string) => void
  selectLayout: (id: string) => void
  resizeRegion: (side: CockpitSide, rows: number, columns: number, discardOccupied?: boolean) => boolean
  setRegionWidth: (side: CockpitSide, width: number) => void
  setRowHeight: (side: CockpitSide, rowId: string, height: number) => void
  setRowTabs: (side: CockpitSide, rowId: string, enabled: boolean) => boolean
  hasWidgetAt: (location: DraftWidgetLocation) => boolean
  addWidget: (location: DraftWidgetLocation, type: string, title?: string, replace?: boolean) => boolean
  moveWidget: (source: DraftWidgetLocation, target: DraftWidgetLocation, replace?: boolean) => MoveWidgetResult
  removeWidget: (location: DraftWidgetLocation) => void
  reorderTabWidgets: (side: CockpitSide, rowId: string, oldIndex: number, newIndex: number) => void
  setActiveTab: (side: CockpitSide, rowId: string, widgetId: string) => void
  reset: () => void
  buildSaveConfig: () => { config: CockpitConfig, validation: CockpitValidationResult }
}

function cloneConfig(config: CockpitConfig): CockpitConfig {
  return JSON.parse(JSON.stringify(config)) as CockpitConfig
}

function widgetsInRow(row: CockpitGridRowConfig): CockpitWidgetInstance[] {
  return row.mode === 'tabs'
    ? row.widgets
    : row.cells.flatMap(cell => cell.widget ? [cell.widget] : [])
}

function hasOccupiedContent(row: CockpitGridRowConfig): boolean {
  return widgetsInRow(row).length > 0
}

function normalizeRowHeights(rows: CockpitGridRowConfig[]): void {
  if (!rows.length)
    return
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.height), 0)
  if (total <= 0) {
    const height = 100 / rows.length
    rows.forEach((row) => {
      row.height = height
    })
    return
  }
  rows.forEach((row) => {
    row.height = Number(((Math.max(0, row.height) / total) * 100).toFixed(3))
  })
  const remainder = Number((100 - rows.reduce((sum, row) => sum + row.height, 0)).toFixed(3))
  rows[rows.length - 1].height = Number((rows[rows.length - 1].height + remainder).toFixed(3))
}

function regionOf(layout: CockpitLayoutConfig, side: CockpitSide): CockpitRegionConfig {
  return side === 'left' ? layout.left : layout.right
}

function cloneLayoutWithIds(source: CockpitLayoutConfig): CockpitLayoutConfig {
  const clone = JSON.parse(JSON.stringify(source)) as CockpitLayoutConfig
  clone.id = createLayout().id
  for (const side of ['left', 'right'] as const) {
    const region = regionOf(clone, side)
    region.columns.forEach((column) => {
      column.id = createGridColumn().id
    })
    region.rows.forEach((row) => {
      const activeWidgetIndex = row.mode === 'tabs'
        ? Math.max(0, row.widgets.findIndex(widget => widget.id === row.activeWidgetId))
        : -1
      row.id = createGridRow(1).id
      row.cells.forEach((cell) => {
        cell.id = createGridCell().id
        if (cell.widget)
          cell.widget.id = createWidgetInstance(cell.widget.type).id
      })
      row.widgets.forEach((widget) => {
        widget.id = createWidgetInstance(widget.type).id
      })
      row.activeWidgetId = row.mode === 'tabs' ? row.widgets[activeWidgetIndex]?.id : undefined
    })
  }
  return clone
}

export function useCockpitDraft(source: CockpitConfig): UseCockpitDraftReturn {
  const original = cloneConfig(source)
  const draft = shallowRef<CockpitConfig>(cloneConfig(source))
  const selection = ref<DraftSelection>({ layoutId: source.activeLayoutId ?? source.layouts[0]?.id })

  function touchDraft(): void {
    triggerRef(draft)
  }

  const layouts = computed(() => [...draft.value.layouts])
  const activeLayout = computed(() => {
    const requested = selection.value.layoutId
    const layout = layouts.value.find(layout => layout.id === requested) ?? layouts.value[0]
    return layout ? { ...layout } : undefined
  })

  function findRow(side: CockpitSide, rowId: string): CockpitGridRowConfig | undefined {
    const layout = activeLayout.value
    return layout ? regionOf(layout, side).rows.find(row => row.id === rowId) : undefined
  }

  function findCell(location: Extract<DraftWidgetLocation, { kind: 'cell' }>): CockpitGridCellConfig | undefined {
    return findRow(location.side, location.rowId)?.cells.find(cell => cell.id === location.cellId)
  }

  function widgetAt(location: DraftWidgetLocation): CockpitWidgetInstance | undefined {
    if (location.kind === 'cell')
      return findCell(location)?.widget
    const widgets = findRow(location.side, location.rowId)?.widgets ?? []
    return location.widgetId ? widgets.find(widget => widget.id === location.widgetId) : widgets[0]
  }

  function addLayout(): void {
    const layout = createLayout(`布局 ${layouts.value.length + 1}`)
    draft.value.layouts.push(layout)
    draft.value.activeLayoutId = layout.id
    selection.value = { layoutId: layout.id }
    touchDraft()
  }

  function duplicateLayout(id: string): void {
    const index = layouts.value.findIndex(layout => layout.id === id)
    if (index < 0)
      return
    const clone = cloneLayoutWithIds(layouts.value[index])
    clone.title = `${clone.title} 副本`
    draft.value.layouts.splice(index + 1, 0, clone)
    selection.value = { layoutId: clone.id }
    touchDraft()
  }

  function removeLayout(id: string): boolean {
    if (layouts.value.length <= 1)
      return false
    const index = layouts.value.findIndex(layout => layout.id === id)
    if (index < 0)
      return false
    draft.value.layouts.splice(index, 1)
    if (selection.value.layoutId === id) {
      const next = draft.value.layouts[index] ?? draft.value.layouts[index - 1]
      selection.value = { layoutId: next?.id }
      draft.value.activeLayoutId = next?.id
    }
    touchDraft()
    return true
  }

  function renameLayout(id: string, title: string): void {
    const layout = draft.value.layouts.find(item => item.id === id)
    if (layout && title.trim()) {
      layout.title = title.trim()
      touchDraft()
    }
  }

  function selectLayout(id: string): void {
    if (!layouts.value.some(layout => layout.id === id))
      return
    selection.value = { layoutId: id }
    draft.value.activeLayoutId = id
    touchDraft()
  }

  function resizeRegion(side: CockpitSide, rowCount: number, columnCount: number, discardOccupied = false): boolean {
    const layout = activeLayout.value
    if (!layout)
      return false
    const region = regionOf(layout, side)
    const rows = Math.max(1, Math.floor(rowCount))
    const columns = Math.max(1, Math.floor(columnCount))
    const removedRows = region.rows.slice(rows)
    const removedCells = region.rows
      .filter(row => row.mode === 'grid')
      .flatMap(row => row.cells.slice(columns))
    if (!discardOccupied && (removedRows.some(hasOccupiedContent) || removedCells.some(cell => cell.widget)))
      return false

    while (region.columns.length < columns)
      region.columns.push(createGridColumn())
    if (region.columns.length > columns)
      region.columns.splice(columns)
    equalizeRegionColumns(region)

    region.rows.forEach((row) => {
      if (row.mode !== 'grid')
        return
      while (row.cells.length < columns)
        row.cells.push(createGridCell())
      if (row.cells.length > columns)
        row.cells.splice(columns)
    })
    if (region.rows.length > rows)
      region.rows.splice(rows)
    while (region.rows.length < rows)
      region.rows.push(createGridRow(columns, 'grid', 100 / rows))
    normalizeRowHeights(region.rows)
    touchDraft()
    return true
  }

  function setRegionWidth(side: CockpitSide, width: number): void {
    const layout = activeLayout.value
    if (!layout || !Number.isFinite(width) || width <= 0)
      return
    const region = regionOf(layout, side)
    region.width = Math.max(region.columns.length, Math.round(width))
    equalizeRegionColumns(region)
    touchDraft()
  }

  function setRowHeight(side: CockpitSide, rowId: string, height: number): void {
    const layout = activeLayout.value
    if (!layout || !Number.isFinite(height))
      return
    const rows = regionOf(layout, side).rows
    const row = rows.find(item => item.id === rowId)
    if (!row)
      return
    if (rows.length === 1) {
      row.height = 100
      touchDraft()
      return
    }
    const others = rows.filter(item => item.id !== rowId)
    const next = Math.min(Math.max(1, height), 100 - others.length)
    const remaining = 100 - next
    const otherTotal = others.reduce((sum, item) => sum + item.height, 0)
    row.height = next
    others.forEach((item) => {
      item.height = otherTotal > 0 ? (item.height / otherTotal) * remaining : remaining / others.length
    })
    normalizeRowHeights(rows)
    touchDraft()
  }

  function setRowTabs(side: CockpitSide, rowId: string, enabled: boolean): boolean {
    const layout = activeLayout.value
    if (!layout)
      return false
    const region = regionOf(layout, side)
    const row = region.rows.find(item => item.id === rowId)
    if (!row || (enabled && row.mode === 'tabs') || (!enabled && row.mode === 'grid'))
      return Boolean(row)
    if (enabled) {
      row.widgets = row.cells.flatMap(cell => cell.widget ? [cell.widget] : [])
      row.cells = []
      row.mode = 'tabs'
      row.activeWidgetId = row.widgets[0]?.id
      touchDraft()
      return true
    }
    if (row.widgets.length > region.columns.length)
      return false
    row.cells = Array.from({ length: region.columns.length }, createGridCell)
    row.widgets.forEach((widget, index) => {
      row.cells[index].widget = widget
    })
    row.widgets = []
    row.activeWidgetId = undefined
    row.mode = 'grid'
    touchDraft()
    return true
  }

  function hasWidgetAt(location: DraftWidgetLocation): boolean {
    return Boolean(widgetAt(location))
  }

  function addWidget(location: DraftWidgetLocation, type: string, title?: string, replace = false): boolean {
    const widget = createWidgetInstance(type, title)
    if (location.kind === 'tabs') {
      const row = findRow(location.side, location.rowId)
      if (!row || row.mode !== 'tabs')
        return false
      row.widgets.push(widget)
      row.activeWidgetId = widget.id
      touchDraft()
      return true
    }
    const cell = findCell(location)
    if (!cell || (cell.widget && !replace))
      return false
    cell.widget = widget
    touchDraft()
    return true
  }

  function removeWidget(location: DraftWidgetLocation): void {
    if (location.kind === 'cell') {
      const cell = findCell(location)
      if (cell)
        cell.widget = undefined
      touchDraft()
      return
    }
    const row = findRow(location.side, location.rowId)
    if (!row || row.mode !== 'tabs')
      return
    const index = location.widgetId ? row.widgets.findIndex(widget => widget.id === location.widgetId) : 0
    if (index >= 0) {
      const removedWasActive = row.widgets[index]?.id === row.activeWidgetId
      row.widgets.splice(index, 1)
      if (removedWasActive || !row.widgets.some(widget => widget.id === row.activeWidgetId))
        row.activeWidgetId = row.widgets[index]?.id ?? row.widgets[index - 1]?.id
      touchDraft()
    }
  }

  function removeLocatedWidget(location: DraftWidgetLocation, widgetId?: string): CockpitWidgetInstance | undefined {
    if (location.kind === 'cell') {
      const cell = findCell(location)
      const widget = cell?.widget
      if (cell)
        cell.widget = undefined
      return widget
    }
    const row = findRow(location.side, location.rowId)
    if (!row || row.mode !== 'tabs')
      return undefined
    const index = widgetId ? row.widgets.findIndex(widget => widget.id === widgetId) : 0
    if (index < 0)
      return undefined
    const [widget] = row.widgets.splice(index, 1)
    row.activeWidgetId = row.widgets.some(item => item.id === row.activeWidgetId) ? row.activeWidgetId : row.widgets[0]?.id
    return widget
  }

  function moveWidget(source: DraftWidgetLocation, target: DraftWidgetLocation, replace = false): MoveWidgetResult {
    const sourceWidget = widgetAt(source)
    if (!sourceWidget)
      return { moved: false, requiresReplace: false }
    if (target.kind === 'cell') {
      const targetCell = findCell(target)
      if (!targetCell)
        return { moved: false, requiresReplace: false }
      if (targetCell.widget && targetCell.widget.id !== sourceWidget.id && !replace)
        return { moved: false, requiresReplace: true }
      const moved = removeLocatedWidget(source, sourceWidget.id)
      if (!moved)
        return { moved: false, requiresReplace: false }
      targetCell.widget = moved
      touchDraft()
      return { moved: true, requiresReplace: false }
    }
    const row = findRow(target.side, target.rowId)
    if (!row || row.mode !== 'tabs')
      return { moved: false, requiresReplace: false }
    const moved = removeLocatedWidget(source, sourceWidget.id)
    if (!moved)
      return { moved: false, requiresReplace: false }
    row.widgets.push(moved)
    row.activeWidgetId = moved.id
    touchDraft()
    return { moved: true, requiresReplace: false }
  }

  function reorderTabWidgets(side: CockpitSide, rowId: string, oldIndex: number, newIndex: number): void {
    const row = findRow(side, rowId)
    if (!row || row.mode !== 'tabs' || oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || oldIndex >= row.widgets.length || newIndex >= row.widgets.length)
      return
    const [widget] = row.widgets.splice(oldIndex, 1)
    row.widgets.splice(newIndex, 0, widget)
    touchDraft()
  }

  function setActiveTab(side: CockpitSide, rowId: string, widgetId: string): void {
    const row = findRow(side, rowId)
    if (row?.mode === 'tabs' && row.widgets.some(widget => widget.id === widgetId)) {
      row.activeWidgetId = widgetId
      touchDraft()
    }
  }

  function reset(): void {
    draft.value = cloneConfig(original)
    selection.value = { layoutId: original.activeLayoutId ?? original.layouts[0]?.id }
    touchDraft()
  }

  function buildSaveConfig(): { config: CockpitConfig, validation: CockpitValidationResult } {
    const validation = validateCockpitConfig(draft.value)
    return { config: normalizeCockpitConfig(draft.value), validation }
  }

  return {
    draft,
    selection,
    layouts,
    activeLayout,
    addLayout,
    duplicateLayout,
    removeLayout,
    renameLayout,
    selectLayout,
    resizeRegion,
    setRegionWidth,
    setRowHeight,
    setRowTabs,
    hasWidgetAt,
    addWidget,
    moveWidget,
    removeWidget,
    reorderTabWidgets,
    setActiveTab,
    reset,
    buildSaveConfig,
  }
}
