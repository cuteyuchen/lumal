import type { LumaLayoutTabItem } from '../src/layout/types'
import { describe, expect, it } from 'vitest'
import {
  appendTab,
  canPinTab,
  canUnpinTab,
  clampTabCount,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  closeTabsLeft,
  isPermanentlyPinned,
  pinTab,
  pushVisitHistory,
  reorderTab,
  resolveNextActivePath,
  sortTabsByPinned,
  unpinTab,
} from '../src/layout'

type TabSeed = Partial<LumaLayoutTabItem> & Pick<LumaLayoutTabItem, 'path' | 'title'>

function buildTabs(seeds: TabSeed[]): LumaLayoutTabItem[] {
  return seeds.map(seed => ({
    closable: true,
    icon: undefined,
    path: seed.path,
    pinned: false,
    title: seed.title,
    ...seed,
    closable: seed.closable ?? true,
    pinned: seed.pinned ?? false,
  }))
}

function createTabs(): LumaLayoutTabItem[] {
  return buildTabs([
    { closable: false, path: '/home', pinned: true, title: '首页' },
    { path: '/work', title: '工作台' },
    { path: '/system', title: '系统管理' },
    { path: '/profile', title: '个人资料' },
  ])
}

describe('tab strategy - pin/unpin', () => {
  it('固定标签会移动到左侧固定组且不会被标识为永久固定', () => {
    const next = pinTab(createTabs(), '/system')
    expect(next.findIndex(tab => tab.path === '/system')).toBe(1)
    expect(isPermanentlyPinned(next.find(tab => tab.path === '/system')!)).toBe(false)
    expect(canUnpinTab(next.find(tab => tab.path === '/system')!)).toBe(true)
  })

  it('取消固定用户固定的标签仍保留路由声明的永久固定', () => {
    const pinned = pinTab(createTabs(), '/work')
    const unpinned = unpinTab(pinned, '/work')
    const workTab = unpinned.find(tab => tab.path === '/work')
    expect(workTab?.pinned).toBe(false)
    expect(canUnpinTab(unpinned.find(tab => tab.path === '/home')!)).toBe(false)
    expect(isPermanentlyPinned(unpinned.find(tab => tab.path === '/home')!)).toBe(true)
  })

  it('不能取消固定路由声明的永久固定标签', () => {
    const next = unpinTab(createTabs(), '/home')
    expect(next.find(tab => tab.path === '/home')?.pinned).toBe(true)
  })

  it('canPinTab/canUnpinTab 给出准确判断', () => {
    const tabs = createTabs()
    expect(canPinTab(tabs.find(tab => tab.path === '/work')!)).toBe(true)
    expect(canPinTab(tabs.find(tab => tab.path === '/home')!)).toBe(false)
    expect(canUnpinTab(tabs.find(tab => tab.path === '/home')!)).toBe(false)
  })
})

describe('tab strategy - sort by pinned', () => {
  it('固定标签始终排在左侧固定组', () => {
    const unordered = buildTabs([
      { path: '/a', title: 'A' },
      { closable: false, path: '/b', pinned: true, title: 'B' },
      { path: '/c', title: 'C' },
    ])
    const sorted = sortTabsByPinned(unordered)
    expect(sorted.map(tab => tab.path)).toEqual(['/b', '/a', '/c'])
  })
})

describe('tab strategy - reorder', () => {
  it('允许在同一固定组内重排', () => {
    const tabs = buildTabs([
      { closable: false, path: '/p1', pinned: true, title: 'P1' },
      { closable: false, path: '/p2', pinned: true, title: 'P2' },
      { path: '/a', title: 'A' },
      { path: '/b', title: 'B' },
    ])
    const next = reorderTab(tabs, '/a', '/b')
    expect(next.map(tab => tab.path)).toEqual(['/p1', '/p2', '/b', '/a'])
  })

  it('拒绝固定与普通标签跨组拖动', () => {
    const tabs = buildTabs([
      { closable: false, path: '/p1', pinned: true, title: 'P1' },
      { path: '/a', title: 'A' },
    ])
    const next = reorderTab(tabs, '/a', '/p1')
    expect(next.map(tab => tab.path)).toEqual(['/p1', '/a'])
  })
})

describe('tab strategy - clamp count', () => {
  it('降低最大标签数时淘汰最早的普通标签，保留固定和当前活动标签', () => {
    const tabs = buildTabs([
      { closable: false, path: '/p1', pinned: true, title: '固定' },
      { path: '/a', title: 'A' },
      { path: '/b', title: 'B' },
      { path: '/c', title: 'C' },
    ])
    const next = clampTabCount(tabs, 2, '/c')
    expect(next.map(tab => tab.path)).toEqual(['/p1', '/c'])
  })

  it('保护数量超过限制时允许暂时超限', () => {
    const tabs = buildTabs([
      { closable: false, path: '/p1', pinned: true, title: 'P1' },
      { closable: false, path: '/p2', pinned: true, title: 'P2' },
      { path: '/a', title: 'A' },
    ])
    const next = clampTabCount(tabs, 2, '/a')
    expect(next.length).toBe(3)
  })
})

describe('tab strategy - append with cap', () => {
  it('超出 maxCount 时淘汰最早可关闭标签且保护当前活动', () => {
    const tabs = buildTabs([
      { path: '/a', title: 'A' },
      { path: '/b', title: 'B' },
    ])
    const next = appendTab(tabs, { closable: true, path: '/c', pinned: false, title: 'C' }, { maxCount: 2 })
    expect(next.map(tab => tab.path)).toEqual(['/b', '/c'])
  })

  it('固定标签不会被最大数量淘汰', () => {
    const tabs = buildTabs([
      { closable: false, path: '/p', pinned: true, title: 'P' },
      { path: '/a', title: 'A' },
    ])
    const next = appendTab(tabs, { closable: true, path: '/b', pinned: false, title: 'B' }, { maxCount: 2 })
    expect(next.map(tab => tab.path)).toEqual(['/p', '/b'])
  })
})

describe('tab strategy - batch close', () => {
  it('关闭全部至少保留固定标签', () => {
    const tabs = createTabs()
    const next = closeAllTabs(tabs)
    expect(next.map(tab => tab.path)).toEqual(['/home'])
  })

  it('没有固定标签时保留首个', () => {
    const tabs = buildTabs([
      { path: '/a', title: 'A' },
      { path: '/b', title: 'B' },
    ])
    const next = closeAllTabs(tabs)
    expect(next.map(tab => tab.path)).toEqual(['/a'])
  })

  it('关闭其他保留固定和目标标签', () => {
    const next = closeOtherTabs(createTabs(), '/system')
    expect(next.map(tab => tab.path)).toEqual(['/home', '/system'])
  })

  it('关闭左侧不会清除固定标签', () => {
    const next = closeTabsLeft(createTabs(), '/system')
    expect(next.map(tab => tab.path)).toEqual(['/home', '/system', '/profile'])
  })

  it('closeTab 忽略固定与不可关闭标签', () => {
    expect(closeTab(createTabs(), '/home').map(tab => tab.path)).toEqual([
      '/home',
      '/work',
      '/system',
      '/profile',
    ])
    expect(closeTab(createTabs(), '/system').map(tab => tab.path)).toEqual([
      '/home',
      '/work',
      '/profile',
    ])
  })
})

describe('tab strategy - visit history', () => {
  it('记录新访问并去重，最新在首位', () => {
    const next = pushVisitHistory(['/system', '/home'], '/work')
    expect(next).toEqual(['/work', '/system', '/home'])
  })

  it('最近访问路径会移动到首位', () => {
    const next = pushVisitHistory(['/system', '/home'], '/system')
    expect(next).toEqual(['/system', '/home'])
  })

  it('最多保留 50 条', () => {
    const base = Array.from({ length: 60 }, (_, index) => `/p${index}`)
    const next = pushVisitHistory(base, '/new')
    expect(next.length).toBe(50)
    expect(next[0]).toBe('/new')
  })
})

describe('tab strategy - next active path', () => {
  it('开启访问历史时返回最近访问且仍存在的标签', () => {
    const tabs = buildTabs([
      { path: '/a', title: 'A' },
      { path: '/b', title: 'B' },
      { path: '/c', title: 'C' },
    ])
    const next = resolveNextActivePath(tabs, '/c', ['/c', '/a', '/b'], { useHistory: true })
    expect(next).toBe('/a')
  })

  it('未启用访问历史时回退右侧或首个', () => {
    // 关闭位置 '/a' 处于列表索引 0，关闭后右侧标签变为新的首个。
    const tabs = buildTabs([
      { path: '/b', title: 'B' },
    ])
    expect(resolveNextActivePath(tabs, '/a', [], { priorClosedIndex: 0 })).toBe('/b')
  })
})
