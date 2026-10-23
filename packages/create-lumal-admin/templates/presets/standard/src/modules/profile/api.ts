import type { SchemaFormModel } from '@lumal/core/components';
import type { BusinessTransport } from '../../app/services/contracts';
import { object, stringArray, text } from '../../shared/api';

export interface Profile {
  id: string;
  username: string;
  nickname: string;
  phone: string;
  roles: string[];
}
export interface ProfileInput {
  nickname: string;
  phone: string;
}
export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}
export function profileInput(model: SchemaFormModel): ProfileInput {
  const nickname = text(model.nickname, '昵称', true);
  const phone = text(model.phone, '手机号');
  if (nickname.length > 32 || (phone && !/^1\d{10}$/.test(phone)))
    throw new Error('昵称最多 32 个字符，手机号为 11 位数字');
  return { nickname, phone };
}
export function passwordInput(model: SchemaFormModel): PasswordInput {
  const currentPassword = text(model.currentPassword, '当前密码', true);
  const newPassword = text(model.newPassword, '新密码', true);
  if (newPassword.length < 8 || newPassword.length > 32 || newPassword !== model.confirmPassword)
    throw new Error('新密码为 8 到 32 位，且两次输入必须相同');
  return { currentPassword, newPassword };
}
function parseProfile(value: unknown): Profile {
  const raw = object(value);
  return {
    ...profileInput(raw),
    id: text(raw.id, '用户 ID', true),
    username: text(raw.username, '用户名', true),
    roles: stringArray(raw.roles),
  };
}
export function createProfileService(transport: BusinessTransport) {
  return {
    get: async () => parseProfile(await transport.request('GET', '/profile')),
    save: async (input: ProfileInput) => parseProfile(await transport.request('PUT', '/profile', { body: input })),
    changePassword: (input: PasswordInput) => transport.request<void>('PUT', '/profile/password', { body: input }),
  };
}
