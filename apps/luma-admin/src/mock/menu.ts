import type { AdminTransportMenuInput } from '../api/adapters'
import type { SystemMenuRecord } from './system'
import { createAdminMenuTransport, createAdminResponseTransport } from '../api/adapters'
import { mockFetchSystemMenus } from './system'

function toCompanyMenu(record: SystemMenuRecord): AdminTransportMenuInput {
  const children = record.children?.filter(child => child.type !== 'button').map(toCompanyMenu)
  const authority = record.permissions?.length
    ? record.permissions
    : record.permission ? [record.permission] : undefined

  return {
    authority,
    children,
    component: record.component,
    externalLink: record.externalLink,
    externalTarget: record.externalTarget,
    hidden: record.hidden,
    icon: record.icon,
    name: record.name || record.id,
    order: record.order,
    path: record.path,
    redirect: record.redirect,
    title: record.title,
    type: record.type,
  }
}

/***********************菜单接口模拟*********************/
export async function mockLoadAdminMenus(): Promise<Record<string, unknown>> {
  const menus = await mockFetchSystemMenus()

  return createAdminResponseTransport(
    menus.filter(menu => menu.type !== 'button').map(toCompanyMenu).map(createAdminMenuTransport),
  )
}
