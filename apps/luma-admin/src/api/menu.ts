import type { NormalizedMenuNode } from '@luma/core/router'
import { mockLoadAdminMenus } from '../mock/menu'
import { parseAdminMenuResponse } from './adapters'

/***********************菜单接口*********************/
export async function loadAdminMenus(): Promise<NormalizedMenuNode[]> {
  return parseAdminMenuResponse(await mockLoadAdminMenus())
}
