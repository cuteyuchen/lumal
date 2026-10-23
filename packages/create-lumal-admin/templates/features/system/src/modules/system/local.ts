import type { DataRow } from '../../app/services/contracts';
import type { LocalBusinessContext, LocalHandler } from '../../app/services/local-contracts';
import { object, stringArray } from '../../app/menu-policy';
import { permissionCodes, permissionTree, viewComponents } from '../../app/router/views';
import { buildStoredMenus } from '../../app/stored-menus';
import { assertHierarchy, buildTree } from '../../shared/tree';
import { configInput } from './config/api';
import { dictionaryItemInput, dictionaryTypeInput } from './dictionary/api';
import { menuInput } from './menu/api';
import { organizationInput } from './organization/api';
import { roleInput } from './role/api';
import { userInput } from './user/api';

const defaultConfig = {
  appName: 'Lumal Admin',
  colorPrimary: '#1677ff',
  layout: 'mixed-nav',
  tabbarEnable: true,
  transitionEnable: true,
};

/** 本地业务模型独立于页面，使用与 HTTP 相同的业务端点和关联约束。 */
export function createLocalHandler({ db, user, assertPermission }: LocalBusinessContext): LocalHandler {
  const initial: Record<string, DataRow[]> = {
    organizations: [
      {
        id: 'root',
        parentId: '',
        name: '总部',
        code: 'root',
        leader: '管理员',
        phone: '',
        email: '',
        status: 'enabled',
        order: 0,
      },
    ],
    'dictionaries/types': [
      { id: 'status', name: '状态', code: 'status', description: '开发演示状态', status: 'enabled' },
    ],
    'dictionaries/items': [
      {
        id: 'enabled',
        typeCode: 'status',
        label: '启用',
        value: 'enabled',
        color: '#15803d',
        order: 1,
        status: 'enabled',
      },
      {
        id: 'disabled',
        typeCode: 'status',
        label: '停用',
        value: 'disabled',
        color: '#64748b',
        order: 2,
        status: 'enabled',
      },
    ],
  };
  const read = (resource: string) => db.read(resource, () => initial[resource] ?? []);
  const cleanUser = ({ password: _password, ...row }: DataRow) => row;
  const hierarchy = (rows: DataRow[]) =>
    rows.map((row): DataRow & { id: string; parentId: string } => ({
      ...row,
      id: String(row.id),
      parentId: String(row.parentId ?? ''),
    }));
  function requireRecord(rows: DataRow[], id: string): DataRow {
    const record = rows.find((row) => row.id === id);
    if (!record) throw new Error('记录不存在');
    return record;
  }
  function validateUser(model: DataRow, id?: string): DataRow {
    const input = userInput(model);
    if (input.nickname.length > 32 || (input.phone && !/^1\d{10}$/.test(input.phone)) || !input.roles.length)
      throw new Error('用户资料无效');
    if (read('users').some((row) => row.id !== id && row.username === input.username)) throw new Error('用户名重复');
    if (
      input.organizationId &&
      !read('organizations').some((row) => row.id === input.organizationId && row.status === 'enabled')
    )
      throw new Error('所属机构不存在或已停用');
    if (input.roles.some((code) => !read('roles').some((row) => row.code === code && row.status === 'enabled')))
      throw new Error('角色不存在或已停用');
    const previous = id ? requireRecord(read('users'), id) : undefined;
    if (
      previous?.username === 'admin' &&
      (input.username !== 'admin' || input.status !== 'enabled' || !input.roles.includes('admin'))
    )
      throw new Error('不能停用或移除内置管理员角色');
    if (previous && JSON.stringify(previous.roles) !== JSON.stringify(input.roles))
      assertPermission('system:user:assign-roles');
    if (previous && previous.status !== input.status) assertPermission('system:user:status');
    return {
      password: 'lumal123',
      ...previous,
      ...input,
      id: id ?? crypto.randomUUID(),
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    };
  }
  function saveRows(resource: string, record: DataRow, id?: string) {
    const rows = read(resource);
    db.write(resource, id ? rows.map((row) => (row.id === id ? record : row)) : [...rows, record]);
    return resource === 'users' ? cleanUser(record) : record;
  }
  function validate(resource: string, body: DataRow, id?: string): DataRow {
    if (resource === 'users') return validateUser(body, id);
    const rows = read(resource);
    const previous = id ? requireRecord(rows, id) : undefined;
    let input: DataRow;
    if (resource === 'roles') {
      if (Object.hasOwn(body, 'permissions')) throw new Error('角色资料与授权必须分别保存');
      input = { ...roleInput(body), builtIn: previous?.builtIn ?? false, permissions: previous?.permissions ?? [] };
      if (previous && input.code !== previous.code) throw new Error('角色编码不允许修改');
      if (previous?.builtIn && input.status !== 'enabled') throw new Error('不能停用内置角色');
    } else if (resource === 'organizations') {
      input = { ...organizationInput(body) };
    } else if (resource === 'menus') {
      input = { ...menuInput(body) };
    } else if (resource === 'dictionaries/types') {
      input = { ...dictionaryTypeInput(body) };
      if (previous && input.code !== previous.code) throw new Error('字典编码不允许修改');
    } else {
      input = { ...dictionaryItemInput(body) };
      if (!read('dictionaries/types').some((row) => row.code === input.typeCode)) throw new Error('字典分类不存在');
      if (rows.some((row) => row.id !== id && row.typeCode === input.typeCode && row.value === input.value))
        throw new Error('同分类字典值重复');
    }
    const unique = ['roles', 'organizations', 'dictionaries/types'].includes(resource) ? 'code' : undefined;
    if (unique && rows.some((row) => row.id !== id && row[unique] === input[unique])) throw new Error('编码重复');
    const record: DataRow = { ...previous, ...input, id: id ?? crypto.randomUUID() };
    const next = id ? rows.map((row) => (row.id === id ? record : row)) : [...rows, record];
    if (resource === 'organizations') assertHierarchy(hierarchy(next));
    if (resource === 'menus') {
      assertHierarchy(hierarchy(next));
      const active = next.filter((row) => row.type !== 'button');
      if (
        new Set(active.map((row) => row.path)).size !== active.length ||
        new Set(active.map((row) => row.name)).size !== active.length
      )
        throw new Error('菜单路径或路由名重复');
      buildStoredMenus(next, viewComponents);
    }
    return record;
  }
  function remove(resource: string, id: string): void {
    const rows = read(resource);
    const record = requireRecord(rows, id);
    if ((resource === 'users' && record.username === 'admin') || (resource === 'roles' && record.builtIn))
      throw new Error('不能删除内置管理员或内置角色');
    if (resource === 'roles' && read('users').some((row) => stringArray(row.roles).includes(String(record.code))))
      throw new Error('角色仍被用户引用');
    if (['menus', 'organizations'].includes(resource) && rows.some((row) => row.parentId === id))
      throw new Error('请先删除子节点');
    if (resource === 'organizations' && read('users').some((row) => row.organizationId === id))
      throw new Error('机构仍有关联用户');
    if (resource === 'dictionaries/types')
      db.write(
        'dictionaries/items',
        read('dictionaries/items').filter((row) => row.typeCode !== record.code),
      );
    db.write(
      resource,
      rows.filter((row) => row.id !== id),
    );
  }
  return {
    handles: (path) => path.startsWith('/system/'),
    async request(method, path, request) {
      user();
      const assertMethod = (...allowed: string[]) => {
        if (!allowed.includes(method)) throw new Error(`此接口不支持 ${method} 操作`);
      };
      const body = request.body === undefined ? {} : object(request.body);
      if (path === '/system/roles/options') {
        assertMethod('GET');
        assertPermission('system:user:list');
        return read('roles').map((row) => ({ label: row.name, value: row.code, disabled: row.status !== 'enabled' }));
      }
      if (path === '/system/organizations/options') {
        assertMethod('GET');
        assertPermission('system:user:list');
        const convert = (items: (DataRow & { id: string; children?: DataRow[] })[]): unknown[] =>
          items.map((row) => ({
            label: row.name,
            value: row.id,
            disabled: row.status !== 'enabled',
            children: convert((row.children ?? []).map((child) => ({ ...child, id: String(child.id) }))),
          }));
        return convert(buildTree(hierarchy(read('organizations'))));
      }
      if (path === '/system/permissions/tree') {
        assertMethod('GET');
        assertPermission('system:role:authorize');
        return structuredClone(permissionTree);
      }
      const grant = path.match(/^\/system\/roles\/([^/]+)\/permissions$/);
      if (grant) {
        assertMethod('GET', 'PUT');
        assertPermission('system:role:authorize');
        const code = decodeURIComponent(grant[1]!);
        const roles = read('roles');
        const role = roles.find((row) => row.code === code);
        if (!role) throw new Error('角色不存在');
        if (method === 'GET') return stringArray(role.permissions ?? []);
        const permissions = stringArray(body.permissions);
        if (permissions.some((code) => !permissionCodes.includes(code))) throw new Error('授权包含未注册权限');
        if (role.code === 'admin' && !permissionCodes.every((code) => permissions.includes(code)))
          throw new Error('不能移除内置管理员权限');
        db.write(
          'roles',
          roles.map((row) => (row.id === role.id ? { ...row, permissions } : row)),
        );
        return permissions;
      }
      const batch = path.match(/^\/system\/users\/batch\/(status|roles)$/);
      const special = path.match(/^\/system\/users\/([^/]+)\/(status|roles|reset-password)$/);
      if (batch || special) {
        const action = batch?.[1] ?? special?.[2];
        assertMethod(action === 'status' ? 'PATCH' : action === 'roles' ? 'PUT' : 'POST');
        assertPermission(`system:user:${action === 'roles' ? 'assign-roles' : action}`);
        const all = read('users');
        const ids = batch ? stringArray(body.ids) : [decodeURIComponent(special![1]!)];
        if (!ids.length) throw new Error('请先选择用户');
        const selected = ids.map((id) => requireRecord(all, id));
        if (action === 'reset-password') {
          const temporaryPassword = crypto.randomUUID().replaceAll('-', '').slice(0, 16);
          db.write(
            'users',
            all.map((row) => (ids.includes(String(row.id)) ? { ...row, password: temporaryPassword } : row)),
          );
          return { temporaryPassword };
        }
        if (batch && action === 'roles' && !['append', 'replace'].includes(String(body.mode)))
          throw new Error('角色分配方式无效');
        const changed = selected.map((row) => {
          const roles = stringArray(body.roles ?? []);
          return validateUser(
            {
              ...row,
              ...(action === 'status'
                ? { status: body.status }
                : {
                    roles:
                      batch && body.mode === 'append' ? [...new Set([...stringArray(row.roles), ...roles])] : roles,
                  }),
            },
            String(row.id),
          );
        });
        db.write(
          'users',
          all.map((row) => changed.find((item) => item.id === row.id) ?? row),
        );
        return batch ? { items: changed.map(cleanUser), updated: changed.length } : cleanUser(changed[0]!);
      }
      if (path.startsWith('/system/dictionaries/options/')) {
        assertMethod('GET');
        const code = decodeURIComponent(path.split('/').at(-1)!);
        if (!read('dictionaries/types').some((row) => row.code === code && row.status === 'enabled')) return [];
        return read('dictionaries/items')
          .filter((row) => row.typeCode === code && row.status === 'enabled')
          .sort((a, b) => Number(a.order) - Number(b.order))
          .map((row) => ({ label: row.label, value: row.value, color: row.color }));
      }
      if (path === '/system/config' || path === '/system/config/restore') {
        assertMethod(...(path.endsWith('/restore') ? ['POST'] : ['GET', 'PUT']));
        assertPermission(`system:config:${method === 'GET' ? 'view' : 'update'}`);
        const config =
          method === 'GET'
            ? db.read('config', () => [{ ...defaultConfig }])[0]!
            : path.endsWith('/restore')
              ? defaultConfig
              : configInput(body);
        if (method !== 'GET') db.write('config', [{ ...config }]);
        return config;
      }
      const match = path.match(
        /^\/system\/(users|roles|menus|organizations|dictionaries\/(?:types|items))(?:\/([^/]+))?$/,
      );
      if (!match) throw new Error(`本地不支持此接口：${method} ${path}`);
      const resource = match[1]!;
      const id = match[2] ? decodeURIComponent(match[2]) : undefined;
      assertMethod(...(id ? ['PUT', 'DELETE'] : ['GET', 'POST']));
      const prefix = {
        users: 'user',
        roles: 'role',
        menus: 'menu',
        organizations: 'organization',
        'dictionaries/types': 'dict',
        'dictionaries/items': 'dict',
      }[resource]!;
      assertPermission(
        `system:${prefix}:${method === 'GET' ? 'list' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update'}`,
      );
      if (method === 'GET') {
        const query = request.query ?? {};
        let result = read(resource);
        if (query.keyword)
          result = result.filter((row) =>
            Object.values(row).some((value) => String(value).includes(String(query.keyword))),
          );
        if (query.status) result = result.filter((row) => row.status === query.status);
        if (query.typeCode) result = result.filter((row) => row.typeCode === query.typeCode);
        if (query.roles) result = result.filter((row) => stringArray(row.roles).includes(String(query.roles)));
        if (query.organizationId) {
          const organizations = hierarchy(read('organizations'));
          const descendants = new Set([String(query.organizationId)]);
          for (let size = -1; size !== descendants.size;) {
            size = descendants.size;
            organizations.filter((row) => descendants.has(row.parentId)).forEach((row) => descendants.add(row.id));
          }
          result = result.filter((row) => descendants.has(String(row.organizationId)));
        }
        if (resource === 'menus' || resource === 'organizations')
          return buildTree(
            hierarchy(result).map((row) => ({
              ...row,
              ...(resource === 'organizations'
                ? { userCount: read('users').filter((user) => user.organizationId === row.id).length }
                : {}),
            })),
          );
        if (resource.startsWith('dictionaries/'))
          return result.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
        const page = Number(query.page ?? 1);
        const size = Number(query.pageSize ?? 10);
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < 1 || size > 1000)
          throw new Error('分页参数无效');
        return {
          items: result
            .slice((page - 1) * size, page * size)
            .map((row) => (resource === 'users' ? cleanUser(row) : row)),
          total: result.length,
        };
      }
      if (method === 'DELETE') {
        remove(resource, id ?? '');
        return;
      }
      const record = validate(resource, body, id);
      return saveRows(resource, record, id);
    },
  };
}
