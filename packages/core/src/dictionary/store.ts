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

    const request = options.fetcher(dictionary)
      .then((response) => {
        const normalized = normalizeDictionaryOptions(response, options, dictionary)
        setDictionary(dictionary, normalized)
        return normalized
      })
      .catch((error: unknown) => {
        errors[dictionary] = resolveErrorMessage(error)
        throw error
      })
      .finally(() => {
        loading[dictionary] = false
        pendingRequests.delete(dictionary)
      })

    pendingRequests.set(dictionary, request)
    return request
  }

  function removeDictionary(dictionary: string): void {
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
