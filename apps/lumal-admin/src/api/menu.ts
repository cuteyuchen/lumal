import type { NormalizedMenuNode } from '@lumal/core/router'
import { adminRequest } from '../services/request'
import { parseAdminMenuData } from './adapters'

export async function loadAdminMenus(): Promise<NormalizedMenuNode[]> {
  return parseAdminMenuData(await adminRequest.get<Record<string, unknown>[]>('/menu'))
}
