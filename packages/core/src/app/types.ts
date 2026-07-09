import type { IconDefinition } from '@luma/icons'
import type { App, Component, Plugin } from 'vue'
import type { DictionaryPluginOptions } from '../dictionary'

/***********************应用上下文类型*********************/
export interface LumaAdminContext {
  app: App
}

export interface CreateLumaAdminOptions {
  components?: Record<string, Component>
  dictionary?: false | DictionaryPluginOptions
  elementPlus?: Plugin
  icons?: {
    localSvg?: IconDefinition[]
  }
  pinia?: Plugin
  router?: Plugin
  rootComponent: Component
  rootProps?: Record<string, unknown>
  setup?: (context: LumaAdminContext) => void | Promise<void>
}

export interface LumaAdminInstance extends LumaAdminContext {
  use: App['use']
  mount: App['mount']
}
