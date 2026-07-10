import type { DictionaryFetcher } from '@luma/core/dictionary'
import { fetchDictionaryOptions } from '../../api/system'

/***********************标准响应 fetcher*********************/
export const mockDictionaryFetcher: DictionaryFetcher = async dictionary => ({
  items: await fetchDictionaryOptions(dictionary),
})
