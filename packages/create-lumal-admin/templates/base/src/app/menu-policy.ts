import type { LumalMenuRecord, LumalRouteMeta } from '@lumal/core/router';
import type { AccessSnapshot } from './services/contracts';

const dangerousKeys = new Set(['constructor', '__proto__', 'prototype']);
const reservedPaths = new Set(['/', '/login', '/403', '/404']);

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('响应必须是对象');
  return value as Record<string, unknown>;
}

export function stringArray(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || !item.trim() || item !== item.trim() || dangerousKeys.has(item))
  )
    throw new Error('角色和权限必须是有效的字符串数组');
  return [...new Set(value)] as string[];
}

export function safeExternalUrl(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    !/^https?:\/\/[^/\\]/i.test(value) ||
    /[\p{Cc}\s\\]/u.test(value)
  )
    throw new Error('外链仅支持明确的 HTTP(S) 绝对地址');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password)
    throw new Error('外链地址格式不安全');
  return url.href;
}

export function isInternalLocation(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\p{Cc}\s]/u.test(value))
    return false;
  const path = value.split(/[?#]/)[0]!;
  return !/%|:|\/\/|(?:^|\/)\.\.?(?:\/|$)/.test(path);
}

export function assertRoutePath(value: unknown): asserts value is string {
  if (!isInternalLocation(value) || /[?#]/.test(value) || reservedPaths.has(value))
    throw new Error(`菜单 path 必须是非保留的站内绝对路径：${String(value)}`);
}

export function resolveView(
  views: Record<string, () => Promise<unknown>>,
  key: unknown,
): (() => Promise<unknown>) | undefined {
  return typeof key === 'string' &&
    !dangerousKeys.has(key) &&
    Object.hasOwn(views, key) &&
    typeof views[key] === 'function'
    ? views[key]
    : undefined;
}

/** 不直接透传远程 meta；后端数据不能关闭登录检查或绕开权限守卫。 */
export function validateMenus(value: unknown, views: Record<string, () => Promise<unknown>>): LumalMenuRecord[] {
  const seen = new WeakSet<object>();
  const paths = new Set<string>();
  const names = new Set<string>();
  let count = 0;
  function visit(items: unknown, parent = '', depth = 0): LumalMenuRecord[] {
    if (!Array.isArray(items) || depth > 30) throw new Error('菜单响应必须是有限层级的数组');
    return items.map((item) => {
      const raw = object(item);
      if (++count > 1000 || seen.has(raw)) throw new Error('菜单存在循环或超过数量限制');
      seen.add(raw);
      assertRoutePath(raw.path);
      if (parent && !raw.path.startsWith(`${parent}/`)) throw new Error('子路由必须属于父级绝对路径');
      if (typeof raw.name !== 'string' || !raw.name.trim() || dangerousKeys.has(raw.name))
        throw new Error('菜单 name 必须是安全的非空字符串');
      if (paths.has(raw.path) || names.has(raw.name)) throw new Error('菜单路径或名称重复');
      paths.add(raw.path);
      names.add(raw.name);
      const component = raw.component === '' || raw.component == null ? undefined : raw.component;
      if (component !== undefined && !resolveView(views, component))
        throw new Error(`菜单组件不在白名单中：${String(component)}`);
      const source = raw.meta === undefined ? {} : object(raw.meta);
      const authority =
        source.authority === undefined
          ? []
          : stringArray(typeof source.authority === 'string' ? [source.authority] : source.authority);
      const roles =
        source.roles === undefined ? [] : stringArray(typeof source.roles === 'string' ? [source.roles] : source.roles);
      const meta: LumalRouteMeta = { authority, roles };
      for (const key of ['title', 'icon', 'activeMenu'] as const) {
        if (source[key] !== undefined && typeof source[key] !== 'string') throw new Error(`菜单 ${key} 必须是字符串`);
        if (typeof source[key] === 'string') meta[key] = source[key];
      }
      if (meta.activeMenu && !isInternalLocation(meta.activeMenu)) throw new Error('激活菜单必须是站内路径');
      for (const key of ['hideInMenu', 'hideInBreadcrumb', 'hideInTab', 'keepAlive', 'affixTab', 'topMenu'] as const) {
        if (source[key] !== undefined && typeof source[key] !== 'boolean') throw new Error(`菜单 ${key} 必须是布尔值`);
        if (source[key] !== undefined) meta[key] = source[key];
      }
      if (source.order !== undefined) {
        if (typeof source.order !== 'number' || !Number.isFinite(source.order))
          throw new Error('菜单排序必须是有限数字');
        meta.order = source.order;
      }
      const external = raw.externalLink ?? source.externalLink;
      if (external !== undefined && external !== '') {
        meta.externalLink = safeExternalUrl(external);
        meta.externalTarget = source.externalTarget === '_self' ? '_self' : '_blank';
      }
      // iframe 使用单独的本地组件和构建时来源白名单，不能使用任意页面加载器。
      if (source.iframeSrc !== undefined) {
        const src = safeExternalUrl(source.iframeSrc);
        const allowed = String(import.meta.env.VITE_IFRAME_ORIGINS ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (component !== 'app/iframe' || !allowed.includes(new URL(src).origin))
          throw new Error('iframe 组件或来源不在独立白名单中');
        meta.iframeSrc = src;
      }
      if (raw.redirect !== undefined && !isInternalLocation(raw.redirect)) throw new Error('菜单重定向必须是站内路径');
      return {
        path: raw.path,
        name: raw.name,
        component: component as string | undefined,
        redirect: typeof raw.redirect === 'string' ? raw.redirect : undefined,
        meta,
        children: raw.children === undefined ? undefined : visit(raw.children, raw.path, depth + 1),
      };
    });
  }
  return visit(value);
}

/** 保留未授权路由供守卫返回 403，目录只重定向到当前身份可访问的后代。 */
export function withAccessibleRedirects(menus: LumalMenuRecord[], access: AccessSnapshot): LumalMenuRecord[] {
  const can = (menu: LumalMenuRecord) => {
    const permissions = menu.meta?.authority;
    const roles = menu.meta?.roles;
    const required = typeof permissions === 'string' ? [permissions] : (permissions ?? []);
    const roleCodes = typeof roles === 'string' ? [roles] : (roles ?? []);
    return (
      required.every((code) => access.permissions.includes(code)) &&
      (!roleCodes.length || roleCodes.some((role) => access.roles.includes(role)))
    );
  };
  function first(items: LumalMenuRecord[]): string | undefined {
    for (const item of items) {
      if (!can(item) || item.meta?.hideInMenu || item.meta?.externalLink) continue;
      const target = first(item.children ?? []);
      if (target) return target;
      if (item.component && !item.children?.length) return item.path;
    }
  }
  return menus.map((menu) => {
    const children = withAccessibleRedirects(menu.children ?? [], access);
    const directory = !menu.component && !menu.meta?.externalLink;
    return {
      ...menu,
      children,
      redirect: directory ? ((can(menu) ? first(children) : undefined) ?? '/403') : menu.redirect,
      meta: { ...menu.meta, ...(directory && !first(children) ? { hideInMenu: true } : {}) },
    };
  });
}
