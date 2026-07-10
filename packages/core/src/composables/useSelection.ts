import type { Ref } from 'vue'
import { computed, ref } from 'vue'

/***********************行选择*********************/
export interface UseSelectionOptions<T> {
  /** 行唯一键取值函数，默认取 `row.id`。 */
  rowKey?: (row: T) => unknown
}

export interface UseSelectionReturn<T> {
  selected: Ref<T[]>
  selectedKeys: Ref<unknown[]>
  hasSelection: Ref<boolean>
  isSelected: (row: T) => boolean
  toggle: (row: T) => void
  setSelected: (rows: T[]) => void
  clear: () => void
}

/**
 * 表格/列表行选择组合式逻辑：维护选中集合、判断与切换，供批量操作使用。
 */
export function useSelection<T = unknown>(options: UseSelectionOptions<T> = {}): UseSelectionReturn<T> {
  const resolveKey = options.rowKey ?? ((row: T) => (row as { id?: unknown }).id)
  const selected = ref<T[]>([]) as Ref<T[]>

  const selectedKeys = computed(() => selected.value.map(resolveKey))
  const hasSelection = computed(() => selected.value.length > 0)

  function isSelected(row: T): boolean {
    const key = resolveKey(row)
    return selected.value.some(item => resolveKey(item) === key)
  }

  function toggle(row: T): void {
    if (isSelected(row)) {
      const key = resolveKey(row)
      selected.value = selected.value.filter(item => resolveKey(item) !== key)
      return
    }

    selected.value = [...selected.value, row]
  }

  function setSelected(rows: T[]): void {
    selected.value = [...rows]
  }

  function clear(): void {
    selected.value = []
  }

  return {
    selected,
    selectedKeys,
    hasSelection,
    isSelected,
    toggle,
    setSelected,
    clear,
  }
}
