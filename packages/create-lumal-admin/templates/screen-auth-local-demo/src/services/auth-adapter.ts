import type { AuthSessionData } from '@lumal/core/auth';

export const authDemo = true;
export const authEnabled = import.meta.env.DEV;

export async function authenticate(username: string, password: string, signal: AbortSignal): Promise<AuthSessionData> {
  signal.throwIfAborted();
  if (!authEnabled) throw new Error('生产环境禁止 Local Demo 登录');
  if (username !== 'demo' || password !== 'demo') throw new Error('演示凭据错误');
  return { accessToken: 'local-demo-only', expiresAt: Date.now() + 3_600_000 };
}

export async function refreshAuth(_refreshToken: string, _signal: AbortSignal): Promise<AuthSessionData> {
  throw new Error('Local Demo 过期后请重新登录');
}
