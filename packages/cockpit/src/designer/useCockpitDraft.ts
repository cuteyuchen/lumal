import type { ComputedRef, Ref } from 'vue'
import type { CockpitValidationResult } from '../config/validate'
import type {
  CockpitCategoryConfig,
  CockpitColumnConfig,
  CockpitConfig,
  CockpitContainerConfig,
  CockpitContainerMode,
  CockpitPageConfig,
  CockpitWidgetInstance,
} from '../types'
import { computed, ref } from 'vue'
import {
  createCategory,
  createCockpitId,
  createColumn,
  createContainer,
  createPage,
  createWidgetInstance,
} from '../config/defaults'
import { normalizeCockpitConfig } from '../config/normalize'
import { validateCockpitConfig } from '../config/validate'

/***********************Designer 草稿管理*********************/

/** 配置保证 JSON 可序列化，深拷贝用 JSON 往返即可 */
function cloneConfig(config: CockpitConfig): CockpitConfig {
  return JSON.parse(JSON.stringify(config)) as CockpitConfig
}

type Side = 'left' | 'right'

export interface DraftSelection {
  categoryId?: string
  pageId?: string
}

export interface UseCockpitDraftReturn {
  draft: Ref<CockpitConfig>
  selection: Ref<DraftSelection>
  activeCategory: ComputedRef<CockpitCategoryConfig | undefined>
  activePage: ComputedRef<CockpitPageConfig | undefined>
  // 分类
  addCategory: () => void
  removeCategory: (id: string) => void
  duplicateCategory: (id: string) => void
  renameCategory: (id: string, label: string) => void
  moveCategory: (id: string, delta: number) => void
  selectCategory: (id: string) => void
  // 页面
  addPage: () => void
  removePage: (id: string) => void
  duplicatePage: (id: string) => void
  renamePage: (id: string, title: string) => void
  movePage: (id: string, delta: number) => void
  selectPage: (id: string) => void
  setPageCenter: (type: string | undefined) => void
  // 列
  addColumn: (side: Side) => void
  removeColumn: (side: Side, columnId: string) => void
  moveColumn: (side: Side, columnId: string, delta: number) => void
  setColumnWidth: (side: Side, columnId: string, width: number) => void
  setColumnHeight: (side: Side, columnId: string, height: number | undefined) => void
  // 容器
  addContainer: (side: Side, columnId: string) => void
  removeContainer: (side: Side, columnId: string, containerId: string) => void
  duplicateContainer: (side: Side, columnId: string, containerId: string) => void
  moveContainer: (side: Side, columnId: string, containerId: string, delta: number) => void
  setContainerHeight: (side: Side, columnId: string, containerId: string, height: number) => void
  setContainerMode: (side: Side, columnId: string, containerId: string, mode: CockpitContainerMode) => void
  setContainerDirection: (side: Side, columnId: string, containerId: string, direction: 'horizontal' | 'vertical') => void
  setContainerActiveWidget: (side: Side, columnId: string, containerId: string, widgetId: string) => void
  // 模块
  addWidget: (side: Side, columnId: string, containerId: string, type: string, title?: string) => void
  removeWidget: (side: Side, columnId: string, containerId: string, widgetId: string) => void
  duplicateWidget: (side: Side, columnId: string, containerId: string, widgetId: string) => void
  moveWidget: (side: Side, columnId: string, containerId: string, widgetId: string, delta: number) => void
  // 生命周期
  reset: () => void
  buildSaveConfig: () => { config: CockpitConfig, validation: CockpitValidationResult }
}

/**
 * 管理 Designer 草稿：
 * - 打开时深拷贝原始配置为独立草稿。
 * - 所有编辑仅修改草稿。
 * - reset 恢复本次打开时的原始配置。
 * - buildSaveConfig 先标准化再校验，供保存前拦截。
 */
export function useCockpitDraft(source: CockpitConfig): UseCockpitDraftReturn {
  // 保存本次打开时的原始快照，供 reset 使用
  const original = cloneConfig(source)
  const draft = ref<CockpitConfig>(cloneConfig(source))
  const selection = ref<DraftSelection>({
    categoryId: source.activeCategoryId ?? source.categories[0]?.id,
    pageId: undefined,
  })

  const activeCategory = computed<CockpitCategoryConfig | undefined>(() => {
    const list = draft.value!.categories
    return list.find(c => c.id === selection.value!.categoryId) ?? list[0]
  })

  const activePage = computed<CockpitPageConfig | undefined>(() => {
    const category = activeCategory.value
    if (!category)
      return undefined
    return category.pages.find(p => p.id === selection.value!.pageId) ?? category.pages[0]
  })

  function findCategory(id: string): CockpitCategoryConfig | undefined {
    return draft.value!.categories.find(c => c.id === id)
  }

  function region(page: CockpitPageConfig, side: Side) {
    return side === 'left' ? page.left : page.right
  }

  function findColumn(side: Side, columnId: string): CockpitColumnConfig | undefined {
    const page = activePage.value
    if (!page)
      return undefined
    return region(page, side).columns.find(col => col.id === columnId)
  }

  function findContainer(side: Side, columnId: string, containerId: string): CockpitContainerConfig | undefined {
    return findColumn(side, columnId)?.containers.find(ct => ct.id === containerId)
  }

  function moveInArray<T>(arr: T[], index: number, delta: number): void {
    const next = index + delta
    if (index < 0 || next < 0 || next >= arr.length)
      return
    const [item] = arr.splice(index, 1)
    arr.splice(next, 0, item)
  }

  /***********************分类*********************/
  function addCategory(): void {
    const category = createCategory(`分类 ${draft.value!.categories.length + 1}`)
    draft.value!.categories.push(category)
    selection.value = { categoryId: category.id, pageId: category.pages[0]?.id }
  }

  function removeCategory(id: string): void {
    const list = draft.value!.categories
    const index = list.findIndex(c => c.id === id)
    if (index < 0)
      return
    list.splice(index, 1)
    // 删除当前分类后选择相邻可用项
    if (selection.value!.categoryId === id) {
      const next = list[index] ?? list[index - 1]
      selection.value = { categoryId: next?.id, pageId: next?.pages[0]?.id }
    }
  }

  function duplicateCategory(id: string): void {
    const list = draft.value!.categories
    const index = list.findIndex(c => c.id === id)
    if (index < 0)
      return
    const clone = cloneConfig({ ...draft.value!, categories: [list[index]] }).categories[0]
    reassignCategoryIds(clone)
    clone.label = `${clone.label} 副本`
    list.splice(index + 1, 0, clone)
  }

  function renameCategory(id: string, label: string): void {
    const category = findCategory(id)
    if (category)
      category.label = label
  }

  function moveCategory(id: string, delta: number): void {
    const list = draft.value!.categories
    moveInArray(list, list.findIndex(c => c.id === id), delta)
  }

  function selectCategory(id: string): void {
    const category = findCategory(id)
    selection.value = { categoryId: id, pageId: category?.pages[0]?.id }
  }

  /***********************页面*********************/
  function addPage(): void {
    const category = activeCategory.value
    if (!category)
      return
    const page = createPage(`页面 ${category.pages.length + 1}`)
    category.pages.push(page)
    selection.value = { categoryId: category.id, pageId: page.id }
  }

  function removePage(id: string): void {
    const category = activeCategory.value
    if (!category)
      return
    const index = category.pages.findIndex(p => p.id === id)
    if (index < 0)
      return
    category.pages.splice(index, 1)
    if (selection.value!.pageId === id) {
      const next = category.pages[index] ?? category.pages[index - 1]
      selection.value = { categoryId: category.id, pageId: next?.id }
    }
  }

  function duplicatePage(id: string): void {
    const category = activeCategory.value
    if (!category)
      return
    const index = category.pages.findIndex(p => p.id === id)
    if (index < 0)
      return
    const clone = clonePageWithNewIds(category.pages[index])
    clone.title = `${clone.title} 副本`
    category.pages.splice(index + 1, 0, clone)
  }

  function renamePage(id: string, title: string): void {
    const page = activeCategory.value?.pages.find(p => p.id === id)
    if (page)
      page.title = title
  }

  function movePage(id: string, delta: number): void {
    const pages = activeCategory.value?.pages
    if (!pages)
      return
    moveInArray(pages, pages.findIndex(p => p.id === id), delta)
  }

  function selectPage(id: string): void {
    selection.value = { categoryId: selection.value!.categoryId, pageId: id }
  }

  function setPageCenter(type: string | undefined): void {
    const page = activePage.value
    if (!page)
      return
    if (!type)
      page.center = undefined
    else
      page.center = { id: page.center?.id ?? createCockpitId('center'), type }
  }

  /***********************列*********************/
  function addColumn(side: Side): void {
    const page = activePage.value
    if (page)
      region(page, side).columns.push(createColumn())
  }

  function removeColumn(side: Side, columnId: string): void {
    const page = activePage.value
    if (!page)
      return
    const columns = region(page, side).columns
    const index = columns.findIndex(col => col.id === columnId)
    if (index >= 0)
      columns.splice(index, 1)
  }

  function moveColumn(side: Side, columnId: string, delta: number): void {
    const page = activePage.value
    if (!page)
      return
    const columns = region(page, side).columns
    moveInArray(columns, columns.findIndex(col => col.id === columnId), delta)
  }

  function setColumnWidth(side: Side, columnId: string, width: number): void {
    const column = findColumn(side, columnId)
    if (column && width > 0)
      column.width = width
  }

  function setColumnHeight(side: Side, columnId: string, height: number | undefined): void {
    const column = findColumn(side, columnId)
    if (column)
      column.height = height !== undefined && height > 0 ? height : undefined
  }

  /***********************容器*********************/
  function addContainer(side: Side, columnId: string): void {
    findColumn(side, columnId)?.containers.push(createContainer())
  }

  function removeContainer(side: Side, columnId: string, containerId: string): void {
    const column = findColumn(side, columnId)
    if (!column)
      return
    const index = column.containers.findIndex(ct => ct.id === containerId)
    if (index >= 0)
      column.containers.splice(index, 1)
  }

  function duplicateContainer(side: Side, columnId: string, containerId: string): void {
    const column = findColumn(side, columnId)
    if (!column)
      return
    const index = column.containers.findIndex(ct => ct.id === containerId)
    if (index < 0)
      return
    const clone = cloneContainerWithNewIds(column.containers[index])
    column.containers.splice(index + 1, 0, clone)
  }

  function moveContainer(side: Side, columnId: string, containerId: string, delta: number): void {
    const column = findColumn(side, columnId)
    if (!column)
      return
    moveInArray(column.containers, column.containers.findIndex(ct => ct.id === containerId), delta)
  }

  function setContainerHeight(side: Side, columnId: string, containerId: string, height: number): void {
    const container = findContainer(side, columnId, containerId)
    if (container && height > 0)
      container.height = height
  }

  function setContainerMode(side: Side, columnId: string, containerId: string, mode: CockpitContainerMode): void {
    const container = findContainer(side, columnId, containerId)
    if (!container)
      return
    container.mode = mode
    if (mode === 'combined' && !container.direction)
      container.direction = 'horizontal'
    if (mode === 'single') {
      // single 只保留第一个模块可见
      container.widgets.forEach((widget, index) => {
        widget.visible = index === 0
      })
    }
    if (mode === 'tabs') {
      const firstVisible = container.widgets.find(w => w.visible !== false)
      container.activeWidgetId = firstVisible?.id
    }
  }

  function setContainerDirection(side: Side, columnId: string, containerId: string, direction: 'horizontal' | 'vertical'): void {
    const container = findContainer(side, columnId, containerId)
    if (container)
      container.direction = direction
  }

  function setContainerActiveWidget(side: Side, columnId: string, containerId: string, widgetId: string): void {
    const container = findContainer(side, columnId, containerId)
    if (container)
      container.activeWidgetId = widgetId
  }

  /***********************模块*********************/
  function addWidget(side: Side, columnId: string, containerId: string, type: string, title?: string): void {
    const container = findContainer(side, columnId, containerId)
    if (!container)
      return
    const widget = createWidgetInstance(type, title)
    // single 模式已有可见模块时，新模块默认不可见
    if (container.mode === 'single' && container.widgets.some(w => w.visible !== false))
      widget.visible = false
    container.widgets.push(widget)
    if (container.mode === 'tabs' && !container.activeWidgetId)
      container.activeWidgetId = widget.id
  }

  function removeWidget(side: Side, columnId: string, containerId: string, widgetId: string): void {
    const container = findContainer(side, columnId, containerId)
    if (!container)
      return
    const index = container.widgets.findIndex(w => w.id === widgetId)
    if (index < 0)
      return
    container.widgets.splice(index, 1)
    if (container.activeWidgetId === widgetId)
      container.activeWidgetId = container.widgets.find(w => w.visible !== false)?.id
  }

  function duplicateWidget(side: Side, columnId: string, containerId: string, widgetId: string): void {
    const container = findContainer(side, columnId, containerId)
    if (!container)
      return
    const index = container.widgets.findIndex(w => w.id === widgetId)
    if (index < 0)
      return
    const source = container.widgets[index]
    const clone: CockpitWidgetInstance = {
      ...source,
      id: createCockpitId('widget'),
      // single 模式副本默认不可见，避免出现两个可见模块
      visible: container.mode === 'single' ? false : source.visible,
    }
    container.widgets.splice(index + 1, 0, clone)
  }

  function moveWidget(side: Side, columnId: string, containerId: string, widgetId: string, delta: number): void {
    const container = findContainer(side, columnId, containerId)
    if (!container)
      return
    moveInArray(container.widgets, container.widgets.findIndex(w => w.id === widgetId), delta)
  }

  /***********************生命周期*********************/
  function reset(): void {
    draft.value = cloneConfig(original)
    selection.value = {
      categoryId: original.activeCategoryId ?? original.categories[0]?.id,
      pageId: undefined,
    }
  }

  function buildSaveConfig(): { config: CockpitConfig, validation: CockpitValidationResult } {
    // 先校验原始草稿以捕获重复 id 等硬错误，再标准化输出
    const validation = validateCockpitConfig(draft.value!)
    const normalized = normalizeCockpitConfig(draft.value!)
    return { config: normalized, validation }
  }

  return {
    draft,
    selection,
    activeCategory,
    activePage,
    addCategory,
    removeCategory,
    duplicateCategory,
    renameCategory,
    moveCategory,
    selectCategory,
    addPage,
    removePage,
    duplicatePage,
    renamePage,
    movePage,
    selectPage,
    setPageCenter,
    addColumn,
    removeColumn,
    moveColumn,
    setColumnWidth,
    setColumnHeight,
    addContainer,
    removeContainer,
    duplicateContainer,
    moveContainer,
    setContainerHeight,
    setContainerMode,
    setContainerDirection,
    setContainerActiveWidget,
    addWidget,
    removeWidget,
    duplicateWidget,
    moveWidget,
    reset,
    buildSaveConfig,
  }
}

/***********************ID 重分配（复制时保持唯一）*********************/

function reassignCategoryIds(category: CockpitCategoryConfig): void {
  category.id = createCockpitId('category')
  category.pages = category.pages.map(clonePageWithNewIds)
  category.activePageId = category.pages[0]?.id
}

function clonePageWithNewIds(page: CockpitPageConfig): CockpitPageConfig {
  const clone = JSON.parse(JSON.stringify(page)) as CockpitPageConfig
  clone.id = createCockpitId('page')
  if (clone.center)
    clone.center.id = createCockpitId('center')
  clone.left.columns = clone.left.columns.map(cloneColumnWithNewIds)
  clone.right.columns = clone.right.columns.map(cloneColumnWithNewIds)
  return clone
}

function cloneColumnWithNewIds(column: CockpitColumnConfig): CockpitColumnConfig {
  column.id = createCockpitId('column')
  column.containers = column.containers.map(cloneContainerWithNewIds)
  return column
}

function cloneContainerWithNewIds(container: CockpitContainerConfig): CockpitContainerConfig {
  const clone = JSON.parse(JSON.stringify(container)) as CockpitContainerConfig
  clone.id = createCockpitId('container')
  const idMap = new Map<string, string>()
  clone.widgets = clone.widgets.map((widget) => {
    const newId = createCockpitId('widget')
    idMap.set(widget.id, newId)
    return { ...widget, id: newId }
  })
  if (clone.activeWidgetId)
    clone.activeWidgetId = idMap.get(clone.activeWidgetId) ?? clone.widgets.find(w => w.visible !== false)?.id
  return clone
}
