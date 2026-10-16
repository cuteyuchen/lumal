import type { CreateLumalAdminOptions, LumalAdminInstance } from './types'
import { createLumalApp } from './createLumalApp'
import { defaultLumalComponents } from './default-components'

/***********************便利型应用入口*********************/
// 该入口保留默认 UI 注册；无 UI 启动请从 @lumal/core/minimal 导入。
export function createLumalAdmin(options: CreateLumalAdminOptions): LumalAdminInstance {
  const minimal = options.preset === 'minimal'
  const selection = options.components ?? !minimal
  const components = selection === true
    ? defaultLumalComponents
    : Array.isArray(selection)
      ? Object.fromEntries(selection
          .filter(name => Boolean(defaultLumalComponents[name]))
          .map(name => [name, defaultLumalComponents[name]!]))
      : selection

  return createLumalApp({
    ...options,
    components,
    dictionary: options.dictionary ?? (minimal ? false : undefined),
  })
}
