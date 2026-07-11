import type { ComputedRef } from 'vue'
import type { DictionaryOption } from './types'
import { computed, watch } from 'vue'
import { getActiveDictionaryContext, useDictionaryContext } from './context'
import { getDictionaryLabel } from './normalize'

type DictionaryGetter = () => Array<false | null | string | undefined>

/***********************字典类型归一化*********************/
function normalizeDictionaryNames(dictionaries: Array<false | null | string | undefined>): string[] {
  return Array.from(new Set(dictionaries.filter((item): item is string => Boolean(item))))
}

/***********************组合式 API*********************/
export function useDictionary(...dictionaries: string[]): Record<string, ComputedRef<DictionaryOption[]>> {
  return useDictionaryMap(() => dictionaries).dictionaryRefs
}

export function useDictionaryMap(getDictionaries: DictionaryGetter): {
  dictionaryMap: ComputedRef<Record<string, DictionaryOption[]>>
  dictionaryRefs: Record<string, ComputedRef<DictionaryOption[]>>
} {
  const context = useDictionaryContext(true)
  const dictionaryRefs: Record<string, ComputedRef<DictionaryOption[]>> = {}

  watch(
    () => normalizeDictionaryNames(getDictionaries()),
    (dictionaries) => {
      dictionaries.forEach((dictionary) => {
        if (!dictionaryRefs[dictionary]) {
          dictionaryRefs[dictionary] = computed(() => context?.store.records[dictionary] ?? [])
        }

        void context?.store.loadDictionary(dictionary).catch(() => [])
      })
    },
    {
      immediate: true,
    },
  )

  const dictionaryMap = computed(() =>
    Object.fromEntries(
      normalizeDictionaryNames(getDictionaries()).map(dictionary => [
        dictionary,
        context?.store.records[dictionary] ?? [],
      ]),
    ),
  )

  return {
    dictionaryMap,
    dictionaryRefs,
  }
}

/***********************直接读取*********************/
export function getDictionaryOptions(dictionary: string): DictionaryOption[] {
  return getActiveDictionaryContext()?.store.records[dictionary] ?? []
}

export function getDictionaryValueLabel(dictionary: string, value: Parameters<typeof getDictionaryLabel>[1]): string {
  return getDictionaryLabel(getDictionaryOptions(dictionary), value)
}
