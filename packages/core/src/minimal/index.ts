import type { CreateLumalMinimalOptions, LumalAdminInstance } from '../app/types'
import { createLumalApp } from '../app/createLumalApp'

/***********************无默认 UI 的启动入口*********************/
export function createLumalAdmin(options: CreateLumalMinimalOptions): LumalAdminInstance {
  return createLumalApp({ ...options, dictionary: options.dictionary ?? false })
}

export type { CreateLumalMinimalOptions, LumalAdminContext, LumalAdminInstance } from '../app/types'
