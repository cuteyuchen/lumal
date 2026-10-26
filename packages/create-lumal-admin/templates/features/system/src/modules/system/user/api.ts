import type { SchemaFormModel } from '@lumal/core/components';
import type { ApplicationService } from '../../../app/services/contracts';
import type { PageInput } from '../../../shared/api';
import type { User, UserBatchResult, UserInput, UserQuery } from './types';
import { formStatus, object, stringArray, text } from '../../../shared/api';

export function userInput(model: SchemaFormModel): UserInput {
  return {
    username: text(model.username, '用户名', true),
    nickname: text(model.nickname, '昵称', true),
    organizationId: text(model.organizationId, '所属机构'),
    roles: stringArray(model.roles),
    phone: text(model.phone, '手机号'),
    status: formStatus(model),
  };
}
export function parseUser(value: unknown): User {
  const raw = object(value);
  return { ...userInput(raw), id: text(raw.id, '用户 ID', true), createdAt: text(raw.createdAt, '创建时间') };
}
export function createUserService(transport: Pick<ApplicationService, 'list' | 'request'>) {
  const path = (id: string) => `/system/users/${encodeURIComponent(id)}`;
  return {
    async list(input: PageInput<UserQuery>) {
      const result = await transport.list('users', { ...input, query: { ...input.query } });
      return { items: result.items.map(parseUser), total: result.total };
    },
    create: async (input: UserInput) => parseUser(await transport.request('POST', '/system/users', { body: input })),
    update: async (id: string, input: UserInput) =>
      parseUser(await transport.request('PUT', path(id), { body: input })),
    remove: (id: string) => transport.request<void>('DELETE', path(id)),
    setStatus: (id: string, status: User['status']) =>
      transport.request<User>('PATCH', `${path(id)}/status`, { body: { status } }),
    assignRoles: (id: string, roles: string[]) =>
      transport.request<User>('PUT', `${path(id)}/roles`, { body: { roles } }),
    batchStatus: (ids: string[], status: User['status']) =>
      transport.request<UserBatchResult>('PATCH', '/system/users/batch/status', { body: { ids, status } }),
    batchRoles: (ids: string[], roles: string[], mode: 'append' | 'replace') =>
      transport.request<UserBatchResult>('PUT', '/system/users/batch/roles', { body: { ids, roles, mode } }),
    async resetPassword(id: string) {
      const result = object(await transport.request('POST', `${path(id)}/reset-password`));
      return { temporaryPassword: text(result.temporaryPassword, '临时密码', true) };
    },
  };
}
