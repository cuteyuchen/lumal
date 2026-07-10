import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import {
  cloneDeep,
  cloneTree,
  createStorage,
  joinPath,
  omitUndefined,
  serializeQuery,
  withInstall,
} from '../src/utils'

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

describe('utils cloneDeep', () => {
  it('会深拷贝并解包 Vue 响应式对象', () => {
    const source = reactive({ list: [{ id: 1 }], name: 'Luma' })
    const cloned = cloneDeep(source)

    expect(cloned).toEqual({ list: [{ id: 1 }], name: 'Luma' })
    expect(cloned.list).not.toBe(source.list)
  })

  it('cloneTree 会深拷贝树结构', () => {
    const tree = [{ children: [{ id: 2 }], id: 1 }]
    const cloned = cloneTree(tree)

    expect(cloned).toEqual([{ children: [{ id: 2 }], id: 1 }])
    expect(cloned[0]?.children).not.toBe(tree[0]?.children)
  })
})

describe('utils object & path', () => {
  it('omitUndefined 会剔除 undefined 字段', () => {
    expect(omitUndefined({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null })
  })

  it('joinPath 会规整拼接路径', () => {
    expect(joinPath('/system/', '/user/', 'list')).toBe('/system/user/list')
    expect(joinPath(undefined, 'dashboard')).toBe('/dashboard')
  })
})

describe('utils serializeQuery', () => {
  it('会序列化数组与嵌套对象并跳过空值', () => {
    const result = serializeQuery({
      empty: null,
      filter: { status: 1 },
      ids: [1, 2],
      keyword: 'Luma',
    })

    expect(result).toBe('filter%5Bstatus%5D=1&ids=1&ids=2&keyword=Luma')
  })
})

describe('utils createStorage', () => {
  it('会以命名空间前缀读写 JSON', () => {
    const storage = createStorage(createMemoryStorage(), 'luma')

    storage.set('profile', { name: 'Luma' })
    expect(storage.get('profile')).toEqual({ name: 'Luma' })

    storage.remove('profile')
    expect(storage.get('profile')).toBeUndefined()
  })
})

describe('utils withInstall', () => {
  it('会挂载 install 并按 name 注册组件', () => {
    const component = withInstall({ name: 'LumaDemo', render: () => null })
    const registered: Record<string, unknown> = {}
    const app = {
      component(name: string, comp: unknown) {
        registered[name] = comp
      },
    }

    component.install(app as never)
    expect(registered.LumaDemo).toBe(component)
  })
})
