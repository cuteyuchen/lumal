import type { App } from 'vue'
import type { DictionaryContext, DictionaryPluginOptions } from './types'
import { inject, provide } from 'vue'
import { createDictionaryStore } from './store'
import { dictionaryContextKey } from './types'

let activeDictionaryContext: DictionaryContext | null = null

/***********************上下文访问*********************/
export function setActiveDictionaryContext(context: DictionaryContext): void {
  activeDictionaryContext = context
}

export function getActiveDictionaryContext(): DictionaryContext | null {
  return activeDictionaryContext
}

export function useDictionaryContext(optional = false): DictionaryContext | null {
  const context = inject(dictionaryContextKey, activeDictionaryContext)

  if (!context && !optional) {
    throw new Error('Luma dictionary context is not installed.')
  }

  return context
}

export function provideDictionaryContext(context: DictionaryContext): void {
  activeDictionaryContext = context
  provide(dictionaryContextKey, context)
}

/***********************插件安装*********************/
export function installDictionary(app: App, options: DictionaryPluginOptions = {}): DictionaryContext {
  const context: DictionaryContext = {
    store: createDictionaryStore(options),
  }

  setActiveDictionaryContext(context)
  app.provide(dictionaryContextKey, context)

  return context
}
