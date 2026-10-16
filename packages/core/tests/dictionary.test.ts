import { describe, expect, it, vi } from 'vitest'
import {
  createDictionaryFetcherWithFallback,
  createDictionaryStore,
  getDictionaryLabel,
  normalizeDictionaryOptions,
} from '../src/dictionary'

describe('dictionary runtime', () => {
  it('只按标准 items 响应解析字典选项', () => {
    expect(normalizeDictionaryOptions({
      items: [
        { color: '#16a34a', label: '启用', value: 'enabled' },
        { disabled: true, label: '停用', value: 'disabled' },
      ],
    })).toEqual([
      { color: '#16a34a', label: '启用', value: 'enabled' },
      { disabled: true, label: '停用', value: 'disabled' },
    ])

    expect(normalizeDictionaryOptions({
      data: [
        { label: '不应被默认解析', value: 'legacy' },
      ],
    })).toEqual([])
  })

  it('支持显式 parseResponse 和 fieldNames 适配非标准响应', () => {
    expect(normalizeDictionaryOptions(
      {
        rows: [
          { code: 1, name: '高' },
          { code: 2, name: '低' },
        ],
      },
      {
        fieldNames: {
          items: 'rows',
          label: 'name',
          value: 'code',
        },
      },
    )).toEqual([
      { label: '高', value: 1 },
      { label: '低', value: 2 },
    ])

    expect(normalizeDictionaryOptions(
      {
        payload: {
          options: [{ text: '公开', id: 'public' }],
        },
      },
      {
        parseResponse: response => (response as { payload: { options: Array<{ id: string, text: string }> } })
          .payload
          .options
          .map(item => ({ label: item.text, value: item.id })),
      },
    )).toEqual([
      { label: '公开', value: 'public' },
    ])
  })

  it('会缓存字典并合并同 key 并发请求', async () => {
    const fetcher = vi.fn(async () => ({
      items: [
        { label: '启用', value: 'enabled' },
      ],
    }))
    const store = createDictionaryStore({ fetcher })

    const [first, second] = await Promise.all([
      store.loadDictionary('status'),
      store.loadDictionary('status'),
    ])
    const third = await store.loadDictionary('status')

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
    expect(third).toEqual(first)
    expect(store.records.status).toEqual([
      { label: '启用', value: 'enabled' },
    ])
  })

  it('会把远程失败或空 items 回退到 fallback', async () => {
    const failedFetcher = createDictionaryFetcherWithFallback({
      fallback: dictionary => [{ label: `${dictionary}-fallback`, value: 'fallback' }],
      remote: async () => {
        throw new Error('network')
      },
      warnOnRemoteFailure: false,
    })
    const emptyFetcher = createDictionaryFetcherWithFallback({
      fallback: [{ label: '本地', value: 'local' }],
      remote: async () => ({ items: [] }),
    })

    await expect(failedFetcher('status')).resolves.toEqual({
      items: [{ label: 'status-fallback', value: 'fallback' }],
    })
    await expect(emptyFetcher('status')).resolves.toEqual({
      items: [{ label: '本地', value: 'local' }],
    })
  })

  it.each(['clear', 'remove', 'set'] as const)('%s 会使在途字典失效，不覆盖手动值或新请求', async (action) => {
    const resolvers: Array<(value: unknown) => void> = []
    const store = createDictionaryStore({
      fetcher: () => new Promise(resolve => resolvers.push(resolve)),
    })
    const old = store.loadDictionary('status')
    await Promise.resolve()
    if (action === 'clear')
      store.clearDictionary()
    else if (action === 'remove')
      store.removeDictionary('status')
    else
      store.setDictionary('status', [{ label: '手动', value: 'manual' }])

    const fresh = action === 'set' ? undefined : store.loadDictionary('status')
    await Promise.resolve()
    resolvers[0]!({ items: [{ label: '旧', value: 'old' }] })
    await old
    if (fresh) {
      expect(store.loading.status).toBe(true)
      expect(store.records.status).toBeUndefined()
      resolvers[1]!({ items: [{ label: '新', value: 'new' }] })
      await fresh
      expect(store.records.status?.[0]?.value).toBe('new')
    }
    else {
      expect(store.records.status?.[0]?.value).toBe('manual')
    }
  })

  it('会翻译单值、多值、空值和未知值', () => {
    const options = [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ]

    expect(getDictionaryLabel(options, 'enabled')).toBe('启用')
    expect(getDictionaryLabel(options, ['enabled', 'disabled'])).toBe('启用, 停用')
    expect(getDictionaryLabel(options, undefined)).toBe('-')
    expect(getDictionaryLabel(options, 'unknown')).toBe('unknown')
  })
})
