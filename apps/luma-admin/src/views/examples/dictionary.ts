import type { DictionaryFetcher, DictionaryOption } from '@luma/core/dictionary'

/***********************示例字典数据*********************/
const dictionaries: Record<string, DictionaryOption[]> = {
  priority: [
    { color: '#dc2626', label: '高', value: 'high' },
    { color: '#2563eb', label: '普通', value: 'normal' },
  ],
  status: [
    { label: '启用', value: 'enabled' },
    { label: '停用', value: 'disabled' },
  ],
}

/***********************标准响应 fetcher*********************/
export const mockDictionaryFetcher: DictionaryFetcher = async dictionary => ({
  items: dictionaries[dictionary] ?? [],
})

export { dictionaries as mockDictionaries }
