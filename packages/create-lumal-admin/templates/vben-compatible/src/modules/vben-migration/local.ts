import type { LocalBusinessContext, LocalHandler } from '../../app/services/local-contracts';
import { appConfig } from '../../app.config';
import { object, stringArray } from '../../app/menu-policy';
import { status } from '../../shared/api';

// 仅迁移示例独立启用时使用，标准系统模块启用后由系统用户服务接管。
export function createLocalHandler({ db, user, assertPermission }: LocalBusinessContext): LocalHandler {
  return {
    handles: (path) => !appConfig.features.includes('system') && /^\/system\/users(?:\/[^/]+)?$/.test(path),
    async request(method, path, input) {
      user();
      if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) throw new Error('不支持的迁移用户操作');
      const id = path.split('/')[3];
      assertPermission(
        `system:user:${method === 'GET' ? 'list' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update'}`,
      );
      const rows = db.read('users');
      if (method === 'GET') {
        const query = input.query ?? {};
        const filtered = rows.filter((row) => !query.keyword || String(row.username).includes(String(query.keyword)));
        const page = Number(query.page ?? 1);
        const size = Number(query.pageSize ?? 10);
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < 1 || size > 1000)
          throw new Error('分页参数无效');
        return {
          items: filtered.slice((page - 1) * size, page * size).map(({ password: _password, ...row }) => row),
          total: filtered.length,
        };
      }
      if (id === 'admin') throw new Error('不能修改或删除内置管理员');
      const previous = rows.find((row) => row.id === id);
      if (id && !previous) throw new Error('用户不存在');
      if (method === 'DELETE') {
        db.write(
          'users',
          rows.filter((row) => row.id !== id),
        );
        return;
      }
      const body = object(input.body);
      const roles = stringArray(body.roles);
      if (
        !body.username ||
        !body.nickname ||
        !roles.length ||
        roles.some((code) => !db.read('roles').some((role) => role.code === code && role.status === 'enabled'))
      )
        throw new Error('用户资料或角色无效');
      if (rows.some((row) => row.id !== id && row.username === body.username)) throw new Error('用户名重复');
      // 只提取允许字段，不能由表单修改密码或注入用户 ID。
      const next = {
        organizationId: '',
        phone: '',
        createdAt: '',
        password: 'lumal123',
        ...previous,
        username: body.username,
        nickname: body.nickname,
        status: status(body.status ?? 'enabled'),
        roles,
        id: id ?? crypto.randomUUID(),
      };
      db.write('users', id ? rows.map((row) => (row.id === id ? next : row)) : [...rows, next]);
      const { password: _password, ...result } = next;
      return result;
    },
  };
}
