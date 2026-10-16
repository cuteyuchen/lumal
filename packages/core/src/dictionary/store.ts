import type { DictionaryOption, DictionaryStore, DictionaryStoreOptions } from './types'
import { reactive } from 'vue'
import { normalizeDictionaryOptions } from './normalize'

/***********************错误处理*********************/
function resolveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/***********************字典状态*********************/
export function createDictionaryStore(options: DictionaryStoreOptions = {}): DictionaryStore {
  const records = reactive<Record<string, DictionaryOption[]>>({})
  const loading = reactive<Record<string, boolean>>({})
  const errors = reactive<Record<string, string | null>>({})
  const pendingRequests = new Map<string, Promise<DictionaryOption[]>>()

  function setDictionary(dictionary: string, dictionaryOptions: DictionaryOption[]): void {
    if (!dictionary) {
      return
    }

    // 手动设置也使旧请求失效；Promise 身份同时充当每个 key 的请求代数。
    pendingRequests.delete(dictionary)
    loading[dictionary] = false
    errors[dictionary] = null
    records[dictionary] = dictionaryOptions
  }

  async function loadDictionary(dictionary: string): Promise<DictionaryOption[]> {
    if (!dictionary) {
      return []
    }

    if (Object.hasOwn(records, dictionary)) {
      return records[dictionary] ?? []
    }

    const pending = pendingRequests.get(dictionary)
    if (pending) {
      return pending
    }

    if (!options.fetcher) {
      setDictionary(dictionary, [])
      return []
    }

    loading[dictionary] = true
    errors[dictionary] = null

    let response: Promise<unknown>
    try {
      response = options.fetcher(dictionary)
    }
    catch (error) {
      response = Promise.reject(error)
    }

    const request = response
      .then((response) => {
        const normalized = normalizeDictionaryOptions(response, options, dictionary)
        if (pendingRequests.get(dictionary) === request)
          records[dictionary] = normalized
        return normalized
      })
      .catch((error: unknown) => {
        if (pendingRequests.get(dictionary) === request)
          errors[dictionary] = resolveErrorMessage(error)
        throw error
      })
      .finally(() => {
        if (pendingRequests.get(dictionary) === request) {
          loading[dictionary] = false
          pendingRequests.delete(dictionary)
        }
      })

    pendingRequests.set(dictionary, request)
    return request
  }

  function removeDictionary(dictionary: string): void {
    pendingRequests.delete(dictionary)
    delete records[dictionary]
    delete loading[dictionary]
    delete errors[dictionary]
  }

  function clearDictionary(): void {
    Object.keys(records).forEach(key => delete records[key])
    Object.keys(loading).forEach(key => delete loading[key])
    Object.keys(errors).forEach(key => delete errors[key])
    pendingRequests.clear()
  }

  return {
    clearDictionary,
    errors,
    loadDictionary,
    loading,
    records,
    removeDictionary,
    setDictionary,
  }
}
