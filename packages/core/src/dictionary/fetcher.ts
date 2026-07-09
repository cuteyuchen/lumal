import type {
  CreateDictionaryFetcherWithFallbackOptions,
  DictionaryOption,
  DictionaryResponse,
} from './types'
import { normalizeDictionaryOptions } from './normalize'

/***********************兜底解析*********************/
async function resolveFallback(
  fallback: CreateDictionaryFetcherWithFallbackOptions['fallback'],
  dictionary: string,
): Promise<DictionaryOption[]> {
  if (!fallback) {
    return []
  }

  if (typeof fallback === 'function') {
    return fallback(dictionary)
  }

  return fallback
}

/***********************远程优先 fetcher*********************/
export function createDictionaryFetcherWithFallback(
  options: CreateDictionaryFetcherWithFallbackOptions,
): (dictionary: string) => Promise<DictionaryResponse> {
  const warnOnRemoteFailure = options.warnOnRemoteFailure ?? true

  return async (dictionary: string) => {
    let remoteOptions: DictionaryOption[] = []

    try {
      remoteOptions = normalizeDictionaryOptions(await options.remote(dictionary))
    }
    catch (error) {
      if (warnOnRemoteFailure) {
        console.warn(`[dictionary] remote fetcher failed for "${dictionary}":`, error)
      }
    }

    if (remoteOptions.length > 0) {
      return {
        items: remoteOptions,
      }
    }

    return {
      items: await resolveFallback(options.fallback, dictionary),
    }
  }
}
