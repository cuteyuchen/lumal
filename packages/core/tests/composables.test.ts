import { describe, expect, it, vi } from 'vitest'
import {
  useConfirmAction,
  useFullscreen,
  usePagination,
  usePersistentState,
  useSelection,
} from '../src/composables'
import { createStorage } from '../src/utils'

function createMemoryStorage(): Storage {
  const map = new Map<string, string>()

  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

describe('usePagination', () => {
  it('会按标准 items/total 加载并翻页', async () => {
    const fetchFn = vi.fn(async (params: Record<string, unknown>) => ({
      items: [{ id: params.page }],
      total: 42,
    }))

    const pagination = usePagination(fetchFn, () => ({ keyword: 'Luma' }))
    await pagination.fetchData()

    expect(fetchFn).toHaveBeenCalledWith({ keyword: 'Luma', page: 1, pageSize: 10 })
    expect(pagination.total.value).toBe(42)
    expect(pagination.items.value).toEqual([{ id: 1 }])

    await pagination.setPage(2)
    expect(pagination.page.value).toBe(2)
    expect(pagination.items.value).toEqual([{ id: 2 }])

    await pagination.query()
    expect(pagination.page.value).toBe(1)
  })
})

describe('useConfirmAction', () => {
  it('确认通过后执行回调，取消则返回 undefined', async () => {
    const okAction = useConfirmAction({ confirm: async () => true })
    const callback = vi.fn(async () => 'done')

    expect(await okAction.confirmAction(callback)).toBe('done')
    expect(callback).toHaveBeenCalledTimes(1)

    const cancelAction = useConfirmAction({
      confirm: async () => {
        throw new Error('cancel')
      },
    })
    const cancelCallback = vi.fn()
    expect(await cancelAction.confirmAction(cancelCallback)).toBeUndefined()
    expect(cancelCallback).not.toHaveBeenCalled()
  })
})

describe('usePersistentState', () => {
  it('会从存储初始化并在变更时写回', async () => {
    const storage = createStorage(createMemoryStorage(), 'luma')
    const state = usePersistentState(storage, 'count', 0)

    expect(state.value).toBe(0)

    state.value = 5
    await Promise.resolve()

    expect(storage.get('count')).toBe(5)
  })
})

describe('useSelection', () => {
  it('会维护选中集合与判断', () => {
    const selection = useSelection<{ id: number }>()

    selection.toggle({ id: 1 })
    selection.toggle({ id: 2 })
    expect(selection.hasSelection.value).toBe(true)
    expect(selection.selectedKeys.value).toEqual([1, 2])

    selection.toggle({ id: 1 })
    expect(selection.selectedKeys.value).toEqual([2])
    expect(selection.isSelected({ id: 2 })).toBe(true)

    selection.clear()
    expect(selection.hasSelection.value).toBe(false)
  })
})

describe('useFullscreen', () => {
  it('在不支持全屏时静默降级', async () => {
    const fullscreen = useFullscreen()

    await expect(fullscreen.toggle()).resolves.toBeUndefined()
    expect(fullscreen.isFullscreen.value).toBe(false)
  })
})
