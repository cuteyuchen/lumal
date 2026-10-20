import type { LumalMenuRecord, LumalRouteMeta } from '@lumal/core/router'

export interface VbenRouteMeta {
  title?: string
  icon?: string
  order?: number
  authority?: string[]
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  hideInTab?: boolean
  affixTab?: boolean
  keepAlive?: boolean
  activePath?: string
  link?: string
  iframeSrc?: string
  ignoreAccess?: boolean
}
export interface VbenMenuRecord {
  path: string
  name?: string
  component?: string
  redirect?: string
  meta?: VbenRouteMeta
  children?: VbenMenuRecord[]
}
function safeUrl(value: string): string {
  if (!/^https?:\/\//i.test(value))
    throw new Error('[lumal/v5] 外链与 iframe 仅接受 HTTP(S) 绝对地址')
  return value
}

/** 这里只转换数据；组件仍由消费应用自己的白名单 resolver 加载。 */
export function adaptVbenRouteMeta(meta: VbenRouteMeta = {}): LumalRouteMeta {
  const { authority, activePath, link, iframeSrc, ignoreAccess, ...native } = meta
  return {
    ...native,
    roles: ignoreAccess ? [] : authority,
    activeMenu: activePath,
    externalLink: link ? safeUrl(link) : undefined,
    iframeSrc: iframeSrc ? safeUrl(iframeSrc) : undefined,
  }
}
export function adaptVbenMenus(records: VbenMenuRecord[], options: { iframeComponent?: string } = {}): LumalMenuRecord[] {
  return records.map((record) => {
    if (record.meta?.iframeSrc && !options.iframeComponent)
      throw new Error('[lumal/v5] iframe 路由必须显式提供应用自己的 iframeComponent')
    return {
      path: record.path,
      name: record.name,
      component: record.meta?.iframeSrc ? options.iframeComponent : record.component,
      redirect: record.redirect,
      meta: adaptVbenRouteMeta(record.meta),
      children: record.children ? adaptVbenMenus(record.children, options) : undefined,
    }
  })
}
