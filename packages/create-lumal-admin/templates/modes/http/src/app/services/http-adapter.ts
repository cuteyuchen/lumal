import type { AuthSessionData } from '@lumal/core/auth';
import type { LumalMenuRecord } from '@lumal/core/router';
import type { AccessSnapshot, CurrentUser, PageResult } from './contracts';
import { parseAuthSession } from '@lumal/core/auth';
import { createStandardResponseParser, parsePageResult } from '@lumal/core/request';
import { object, resolveView, safeExternalUrl, stringArray, validateMenus } from '../menu-policy';
import { localMenus, viewComponents } from '../router/views';

export interface HttpAdapter {
  parseResponse: (data: unknown) => unknown;
  parseSession: (data: unknown) => AuthSessionData;
  parseUser: (data: unknown) => CurrentUser;
  parseAccess: (data: unknown) => AccessSnapshot;
  parseMenus: (data: unknown) => LumalMenuRecord[];
  parsePage: (data: unknown) => PageResult;
  errorMessage: (data: unknown) => string | undefined;
  menusPath: string;
}
function errorMessage(value: unknown, key = 'message'): string | undefined {
  if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return;
  const message = (value as Record<string, unknown>)[key];
  return typeof message === 'string' && message.trim() ? message.trim().slice(0, 500) : undefined;
}
function parseUser(value: unknown): CurrentUser {
  const raw = object(value);
  if (!['id', 'name', 'username'].every((key) => typeof raw[key] === 'string' && raw[key]))
    throw new Error('当前用户缺少 id/name/username');
  return { id: String(raw.id), name: String(raw.name), username: String(raw.username) };
}
function parseAccess(value: unknown): AccessSnapshot {
  const raw = object(value);
  return { roles: stringArray(raw.roles), permissions: stringArray(raw.permissions) };
}
const parseMenus = (value: unknown) => validateMenus(value, viewComponents);
function flatten(menus: LumalMenuRecord[]): LumalMenuRecord[] {
  return menus.flatMap((menu) => [menu, ...flatten(menu.children ?? [])]);
}

export function createHttpAdapter(name = 'standard'): HttpAdapter {
  const standard: HttpAdapter = {
    parseResponse: (value) => value,
    parseSession: parseAuthSession,
    parseUser,
    parseAccess,
    parseMenus,
    parsePage: (value) => (Array.isArray(value) ? { items: value, total: value.length } : parsePageResult(value)),
    errorMessage,
    menusPath: '/menus',
  };
  if (name === 'standard') return standard;
  if (name !== 'lumal-mock') throw new Error(`未知 HTTP adapter：${name}`);
  const unwrap = createStandardResponseParser({
    fieldNames: { code: 'statusCode', data: 'result', message: 'resultMsg' },
    successCodes: ['0000'],
    sessionExpiredCodes: ['AUTH_EXPIRED'],
  });
  const aliases: Record<string, string> = {
    'system/user': 'system/users',
    'system/role': 'system/roles',
    'system/menu': 'system/menus',
    'system/organization': 'system/organizations',
    'system/dict': 'system/dictionaries/types',
    'system/dict-item': 'system/dictionaries/items',
  };
  const supported = new Map(
    flatten(localMenus)
      .filter((menu) => menu.component)
      .map((menu) => [menu.component!, menu]),
  );
  return {
    ...standard,
    parseResponse: (data) => unwrap({ data } as Parameters<typeof unwrap>[0]),
    errorMessage: (value) => errorMessage(value, 'resultMsg'),
    parseSession: (value) =>
      parseAuthSession(value, {
        fieldNames: { accessToken: 'access_token', refreshToken: 'refresh_token', expiresAt: 'expire_time' },
      }),
    parsePage: (value) =>
      Array.isArray(value)
        ? { items: value, total: value.length }
        : parsePageResult(value, { fieldNames: { items: 'records', total: 'totalNum' } }),
    menusPath: '/menu',
    parseAccess(value) {
      const access = parseAccess(value);
      // Mock API 实际以 config:view 保护写接口，显式映射到应用的 update 权限。
      return {
        ...access,
        permissions: access.permissions.includes('system:config:view')
          ? [...new Set([...access.permissions, 'system:config:update'])]
          : access.permissions,
      };
    },
    parseMenus(value) {
      const visit = (items: unknown): LumalMenuRecord[] => {
        if (!Array.isArray(items)) throw new Error('Mock 菜单响应必须是数组');
        return items.flatMap((item) => {
          const raw = object(item);
          const key = String(raw.viewPath ?? '');
          if (['constructor', '__proto__', 'prototype'].includes(key)) throw new Error('菜单组件不在白名单中');
          const component = Object.hasOwn(aliases, key) ? aliases[key]! : key;
          const selected = supported.get(component);
          const children = raw.nodes === undefined ? [] : visit(raw.nodes);
          if (key && !selected && !children.length) return []; // 明确的 Mock adapter 只接入当前预设已生成的页面。
          if (selected && !resolveView(viewComponents, component)) throw new Error('菜单组件不在白名单中');
          if (!selected && !children.length) return [];
          const sourceMeta = raw.meta === undefined ? {} : object(raw.meta);
          return [
            {
              path: selected?.path ?? String(raw.routePath),
              name: selected?.name ?? String(raw.routeName),
              component: selected?.component,
              meta: {
                ...selected?.meta,
                ...sourceMeta,
                title: String(raw.menuName ?? selected?.meta?.title ?? ''),
                authority: stringArray(raw.authCode ?? []),
                order: Number(raw.sortNo ?? selected?.meta?.order ?? 0),
                ...(raw.url ? { externalLink: safeExternalUrl(raw.url) } : {}),
              },
              children,
            },
          ];
        });
      };
      return parseMenus(visit(value));
    },
  };
}
