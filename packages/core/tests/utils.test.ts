import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import {
  cloneDeep,
  cloneTree,
  createStorage,
  isBlobResponse,
  joinPath,
  maskPhone,
  omitUndefined,
  serializeQuery,
  withAlpha,
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

describe('utils display & color', () => {
  it('withAlpha 会把标准主题色转换为 rgba 并约束透明度', () => {
    expect(withAlpha('#1677ff', 0.25)).toBe('rgba(22, 119, 255, 0.25)')
    expect(withAlpha('#1677ff', 2)).toBe('rgba(22, 119, 255, 1)')
    expect(withAlpha('var(--el-color-primary)', 0.5)).toBe('var(--el-color-primary)')
  })

  it('maskPhone 会保留手机号前三位和后四位', () => {
    expect(maskPhone('13800138000')).toBe('138****8000')
    expect(maskPhone('1234567')).toBe('1234567')
  })

  it('isBlobResponse 会区分 JSON 错误体与文件内容', async () => {
    await expect(isBlobResponse({ text: async () => JSON.stringify({ message: 'error' }) })).resolves.toBe(false)
    await expect(isBlobResponse({ text: async () => 'plain file content' })).resolves.toBe(true)
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
