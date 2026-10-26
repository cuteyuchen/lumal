import { parseAuthSession } from '@lumal/core/auth';
import { publicRequest } from './http';

export const authDemo = false;
export const authEnabled = true;

export async function authenticate(username: string, password: string, signal: AbortSignal) {
  return parseAuthSession(await publicRequest.post('/auth/login', { body: { username, password }, signal }));
}

export async function refreshAuth(refreshToken: string, signal: AbortSignal) {
  if (!refreshToken) throw new Error('会话已过期，请重新登录');
  return parseAuthSession(await publicRequest.post('/auth/refresh', { body: { refreshToken }, signal }));
}
