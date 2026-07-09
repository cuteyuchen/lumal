import type { InjectionKey } from 'vue'

export type DictionaryValue = boolean | number | string
export type DictionaryLabelValue = DictionaryValue | DictionaryValue[] | null | undefined

export interface DictionaryOption {
  label: string
  value: DictionaryValue
  disabled?: boolean
  children?: DictionaryOption[]
  color?: string
  meta?: Record<string, unknown>
}

export interface DictionaryResponse {
  items: DictionaryOption[]
}

export interface DictionaryFieldNames {
  items?: string
  label?: string
  value?: string
  disabled?: string
  children?: string
  color?: string
}

export type DictionaryResponseParser = (
  response: unknown,
  dictionary?: string,
) => DictionaryOption[]

export interface NormalizeDictionaryOptions {
  fieldNames?: DictionaryFieldNames
  parseResponse?: DictionaryResponseParser
}

export type DictionaryFetcher = (dictionary: string) => Promise<unknown>

export interface DictionaryStoreOptions extends NormalizeDictionaryOptions {
  fetcher?: DictionaryFetcher
}

export interface DictionaryStore {
  records: Record<string, DictionaryOption[]>
  loading: Record<string, boolean>
  errors: Record<string, string | null>
  loadDictionary: (dictionary: string) => Promise<DictionaryOption[]>
  setDictionary: (dictionary: string, options: DictionaryOption[]) => void
  removeDictionary: (dictionary: string) => void
  clearDictionary: () => void
}

export interface DictionaryContext {
  store: DictionaryStore
}

export interface DictionaryPluginOptions extends DictionaryStoreOptions {}

export type DictionaryFallback
  = | DictionaryOption[]
    | ((dictionary: string) => DictionaryOption[] | Promise<DictionaryOption[]>)

export interface CreateDictionaryFetcherWithFallbackOptions {
  remote: DictionaryFetcher
  fallback?: DictionaryFallback
  warnOnRemoteFailure?: boolean
}

export const dictionaryContextKey: InjectionKey<DictionaryContext> = Symbol('luma-dictionary-context')
