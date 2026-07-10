import type { IconDefinition } from '@luma/icons'
import type { App, Component, Plugin } from 'vue'
import type { DictionaryPluginOptions } from '../dictionary'
import type { PermissionStore } from '../permission'

export type LumaAdminPreset = 'admin-default' | 'minimal'

export type LumaRouterPlugin = Plugin & {
  isReady?: () => Promise<void>
}

export interface LumaElementPlusOptions {
  options?: Record<string, unknown>
  plugin: Plugin
}

export type LumaElementPlusInput = Plugin | LumaElementPlusOptions

export type LumaComponentSelection = boolean | string[] | Record<string, Component>

/***********************应用上下文类型*********************/
export interface LumaAdminContext {
  app: App
  permissionStore?: PermissionStore
  pinia?: Plugin
  router?: LumaRouterPlugin
}

export interface CreateLumaAdminOptions {
  components?: LumaComponentSelection
  dictionary?: false | DictionaryPluginOptions
  elementPlus?: LumaElementPlusInput
  icons?: {
    localSvg?: IconDefinition[]
  }
  permissionStore?: PermissionStore
  pinia?: Plugin
  preset?: LumaAdminPreset
  router?: LumaRouterPlugin
  rootComponent: Component
  rootProps?: Record<string, unknown>
  setup?: (context: LumaAdminContext) => void | Promise<void>
}

export interface LumaAdminInstance extends LumaAdminContext {
  mount: (container: Element | string) => Promise<ReturnType<App['mount']>>
  use: (plugin: Plugin, ...options: unknown[]) => LumaAdminInstance
}
