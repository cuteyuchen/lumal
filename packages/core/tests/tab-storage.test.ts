import type { LumaLayoutTabItem } from '../src/layout/types'
import { describe, expect, it } from 'vitest'
import {
  clearTabSnapshot,
  DEFAULT_MAX_VISIT_HISTORY,
  deserializeTabSnapshot,
  readTabSnapshot,
  restoreTabsFromSnapshot,
  serializeTabSnapshot,
  TAB_SNAPSHOT_VERSION,
  writeTabSnapshot,
} from '../src/layout'

const fixedTabs: LumaLayoutTabItem[] = [
  { closable: false, path: '/home', pinned: true, title: '首页' },
]

function buildTabs(): LumaLayoutTabItem[] {
  return [
    { closable: false, path: '/home', pinned: true, title: '首页' },
    { closable: true, path: '/work', pinned: false, title: '工作台' },
    { closable: true, path: '/system', pinned: false, title: '系统管理' },
  ]
}

function buildHistory(): string[] {
  return ['/home', '/work', '/system']
}

function createMemoryStorage(): { store: Record<string, string>, storage: { getItem: (key: string) => string | null, removeItem: (key: string) => void, setItem: (key: string, value: string) => void } } {
  const store: Record<string, string> = {}
  return {
    store,
    storage: {
      getItem: (key: string) => store[key] ?? null,
      removeItem: (key: string) => {
        delete store[key]
      },
      setItem: (key: string, value: string) => {
        store[key] = value
      },
    },
  }
}

describe('tab-storage - serialization', () => {
  it('serializeTabSnapshot 会输出带版本的快照', () => {
    const snapshot = serializeTabSnapshot({ tabs: buildTabs(), history: buildHistory() })
    expect(snapshot.v).toBe(TAB_SNAPSHOT_VERSION)
    expect(snapshot.tabs.map(item => item.path)).toEqual(['/home', '/work', '/system'])
    expect(snapshot.tabs[0]).toMatchObject({ closable: false, pinned: true })
    expect(snapshot.history).toEqual(['/home', '/work', '/system'])
  })

  it('serializeTabSnapshot 会按上限截断访问历史', () => {
    const history = Array.from({ length: DEFAULT_MAX_VISIT_HISTORY + 5 }, (_, index) => `/p${index}`)
    const snapshot = serializeTabSnapshot({ tabs: buildTabs(), history })
    expect(snapshot.history.length).toBe(DEFAULT_MAX_VISIT_HISTORY)
  })
})

describe('tab-storage - deserialize', () => {
  it('deserialize 能正确解析序列化后的字符串', () => {
    const snapshot = serializeTabSnapshot({ tabs: buildTabs(), history: buildHistory() })
    const raw = JSON.stringify(snapshot)
    const parsed = deserializeTabSnapshot(raw)
    expect(parsed?.v).toBe(TAB_SNAPSHOT_VERSION)
    expect(parsed?.tabs.length).toBe(3)
  })

  it('deserialize 对损坏或版本不匹配数据返回 undefined', () => {
    expect(deserializeTabSnapshot(null)).toBeUndefined()
    expect(deserializeTabSnapshot('not-json')).toBeUndefined()
    expect(deserializeTabSnapshot('{"v":99,"tabs":[],"history":[]}')).toBeUndefined()
    expect(deserializeTabSnapshot(JSON.stringify({ v: TAB_SNAPSHOT_VERSION, tabs: 'not-array', history: [] }))).toBeUndefined()
    expect(deserializeTabSnapshot(JSON.stringify({ v: TAB_SNAPSHOT_VERSION, tabs: [], history: [123] }))).toBeUndefined()
  })
})

describe('tab-storage - storage wrapper', () => {
  it('writeTabSnapshot/readTabSnapshot 通过存储正常读写', () => {
    const { store, storage } = createMemoryStorage()
    const snapshot = serializeTabSnapshot({ tabs: buildTabs(), history: buildHistory() })
    expect(writeTabSnapshot(storage, 'tabs', snapshot)).toBe(true)
    expect(store.tabs).toBeTruthy()
    const read = readTabSnapshot(storage, 'tabs')
    expect(read?.tabs.length).toBe(3)
  })

  it('readTabSnapshot 对损坏数据返回 undefined 并清除', () => {
    const { store, storage } = createMemoryStorage()
    storage.setItem('tabs', '{invalid')
    const read = readTabSnapshot(storage, 'tabs')
    expect(read).toBeUndefined()
    expect(Object.hasOwn(store, 'tabs')).toBe(false)
  })

  it('clearTabSnapshot 会移除对应键', () => {
    const { store, storage } = createMemoryStorage()
    storage.setItem('tabs', 'content')
    clearTabSnapshot(storage, 'tabs')
    expect(Object.hasOwn(store, 'tabs')).toBe(false)
  })
})

describe('tab-storage - restore merge', () => {
  it('恢复会合并路由固定页签、过滤无效路由并补入当前路由', () => {
    const snapshot = serializeTabSnapshot({ tabs: buildTabs(), history: buildHistory() })
    const restored = restoreTabsFromSnapshot(snapshot, {
      currentPath: '/profile',
      fixedTabs,
      isValidPath: path => path !== '/system',
      resolveTab: path => ({
        title: path === '/profile' ? '个人资料' : undefined,
      }),
    })
    const paths = restored.tabs.map(tab => tab.path)
    expect(paths).toContain('/home')
    expect(paths).not.toContain('/system')
    expect(paths).toContain('/profile')
    expect(restored.tabs.find(tab => tab.path === '/profile')?.title).toBe('个人资料')
  })

  it('没有快照时退化为固定页签加当前页', () => {
    const restored = restoreTabsFromSnapshot(undefined, {
      currentPath: '/dashboard',
      fixedTabs,
    })
    expect(restored.tabs.map(tab => tab.path)).toEqual(['/home', '/dashboard'])
    expect(restored.history).toEqual([])
  })

  it('固定组始终排在左侧', () => {
    const snapshot = serializeTabSnapshot({
      tabs: [
        { closable: true, path: '/work', pinned: false, title: '工作台' },
        { closable: false, path: '/home', pinned: true, title: '首页' },
      ],
      history: [],
    })
    const restored = restoreTabsFromSnapshot(snapshot, {
      currentPath: '/dashboard',
      fixedTabs,
    })
    const firstPath = restored.tabs[0]?.path
    expect(firstPath).toBe('/home')
  })
})
