import type { SchemaFormModel } from '@lumal/core/components';
import type { ApplicationService } from '../../../app/services/contracts';
import type { PageInput } from '../../../shared/api';
import type { Role, RoleInput } from './types';
import { formStatus, object, stringArray, text } from '../../../shared/api';
import { parsePermissionTree } from './permission-tree';

export function roleInput(model: SchemaFormModel): RoleInput {
  return {
    code: text(model.code, '角色编码', true),
    name: text(model.name, '角色名称', true),
    description: text(model.description, '说明'),
    status: formStatus(model),
  };
}
export function parseRole(value: unknown): Role {
  const raw = object(value);
  return { ...roleInput(raw), id: text(raw.id, '角色 ID', true), builtIn: raw.builtIn === true };
}
export function createRoleService(transport: Pick<ApplicationService, 'list' | 'request'>) {
  return {
    async list(input: PageInput) {
      const page = await transport.list('roles', { ...input, query: { ...input.query } });
      return { items: page.items.map(parseRole), total: page.total };
    },
    create: async (input: RoleInput) => parseRole(await transport.request('POST', '/system/roles', { body: input })),
    update: async (id: string, input: RoleInput) =>
      parseRole(await transport.request('PUT', `/system/roles/${encodeURIComponent(id)}`, { body: input })),
    remove: (id: string) => transport.request<void>('DELETE', `/system/roles/${encodeURIComponent(id)}`),
    tree: async () => parsePermissionTree(await transport.request('GET', '/system/permissions/tree')),
    permissions: async (code: string) =>
      stringArray(await transport.request('GET', `/system/roles/${encodeURIComponent(code)}/permissions`)),
    authorize: async (code: string, permissions: string[]) =>
      stringArray(
        await transport.request('PUT', `/system/roles/${encodeURIComponent(code)}/permissions`, {
          body: { permissions },
        }),
      ),
  };
}
