import type { LumaMenuRecord } from '@luma/core/router'
import { adminRouteRecords } from '../router/routes'

function toCompanyMenu(record: LumaMenuRecord): Record<string, unknown> {
  const meta = record.meta ?? {}

  return {
    authCode: meta.authority,
    menuIcon: meta.icon,
    menuName: meta.title,
    meta: {
      ...meta,
      authority: undefined,
      icon: undefined,
      order: undefined,
      title: undefined,
    },
    nodes: record.children?.map(toCompanyMenu),
    routeName: record.name,
    routePath: record.path,
    sortNo: meta.order,
    url: record.externalLink,
    viewPath: record.component,
  }
}

/***********************菜单接口模拟*********************/
export async function mockLoadAdminMenus(): Promise<Record<string, unknown>> {
  return {
    result: adminRouteRecords.map(toCompanyMenu),
    resultMsg: 'ok',
    statusCode: '0000',
  }
}
