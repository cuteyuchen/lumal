import type { LumalMenuRecord } from '@lumal/core/router'
import type { DataRow } from './services/contracts'
import { assertHierarchy } from '../shared/tree'
import { safeExternalUrl, stringArray, validateMenus } from './menu-policy'

export function seedMenuRows(menus: LumalMenuRecord[], parentId = ''): DataRow[] {
  return menus.flatMap(menu => [
    {
      id: menu.name ?? menu.path,
      parentId,
      path: menu.path,
      name: menu.name ?? menu.path,
      type: menu.component ? 'menu' : 'directory',
      title: String(menu.meta?.title ?? menu.name),
      component: menu.component ?? '',
      icon: menu.meta?.icon ?? '',
      order: menu.meta?.order ?? 0,
      hidden: menu.meta?.hideInMenu === true,
      permissions: typeof menu.meta?.authority === 'string' ? [menu.meta.authority] : menu.meta?.authority ?? [],
      roles: typeof menu.meta?.roles === 'string' ? [menu.meta.roles] : menu.meta?.roles ?? [],
      keepAlive: menu.meta?.keepAlive !== false,
      hideInTab: menu.meta?.hideInTab === true,
      externalLink: '',
    },
    ...seedMenuRows(menu.children ?? [], menu.name ?? menu.path),
  ])
}
export function buildStoredMenus(rows: DataRow[], views: Record<string, () => Promise<unknown>>): LumalMenuRecord[] {
  const items = rows.map((row): DataRow & { id: string, parentId: string } => ({ ...row, id: String(row.id), parentId: String(row.parentId ?? '') }))
  assertHierarchy(items)
  for (const row of items) {
    const parent = items.find(item => item.id === row.parentId)
    if (parent && !['directory', 'menu'].includes(String(parent.type)))
      throw new Error('只有目录和菜单可以包含子节点')
  }
  function visit(parentId = ''): LumalMenuRecord[] {
    return items.filter(row => row.parentId === parentId && row.type !== 'button')
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map(row => ({
        path: String(row.path),
        name: String(row.name),
        component: ['directory', 'external'].includes(String(row.type)) ? undefined : String(row.component),
        meta: {
          title: String(row.title),
          order: Number(row.order ?? 0),
          icon: String(row.icon ?? ''),
          hideInMenu: row.hidden === true,
          keepAlive: row.keepAlive !== false,
          hideInTab: row.hideInTab === true,
          affixTab: row.path === '/dashboard',
          authority: stringArray(row.permissions ?? []),
          roles: stringArray(row.roles ?? []),
          ...(row.type === 'external' ? { externalLink: safeExternalUrl(row.externalLink), externalTarget: '_blank' } : {}),
          ...(row.type === 'embedded' ? { iframeSrc: safeExternalUrl(row.externalLink) } : {}),
        },
        children: visit(row.id),
      }))
  }
  // 空目录允许先保存；隐藏该目录，直到存在可访问的页面。
  const prune = (menus: LumalMenuRecord[]): LumalMenuRecord[] => menus.flatMap((menu) => {
    const children = prune(menu.children ?? [])
    return !menu.component && !menu.meta?.externalLink && !children.length ? [] : [{ ...menu, children }]
  })
  return validateMenus(prune(visit()), views)
}
