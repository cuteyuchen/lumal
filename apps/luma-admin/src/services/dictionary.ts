import { getActiveDictionaryContext } from '@luma/core/dictionary'

export interface RefreshAdminDictionaryOptions {
  reload?: boolean
}

export async function refreshAdminDictionaryCache(
  typeCode: string,
  options: RefreshAdminDictionaryOptions = {},
): Promise<boolean> {
  const normalizedTypeCode = typeCode.trim()

  if (!normalizedTypeCode) {
    throw new Error('请选择需要刷新的字典类型')
  }

  const store = getActiveDictionaryContext()?.store
  if (!store) {
    return false
  }

  store.removeDictionary(normalizedTypeCode)
  if (options.reload !== false) {
    await store.loadDictionary(normalizedTypeCode)
  }

  return true
}
