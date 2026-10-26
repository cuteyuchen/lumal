import type { AuthSessionData } from '@lumal/core/auth';
import { createAuthSession } from '@lumal/core/auth';
import { shallowRef } from 'vue';
import { authEnabled, authenticate, refreshAuth } from './auth-adapter';

/***********************独立会话*********************/
const session = createAuthSession({
  storage: typeof sessionStorage === 'undefined' ? undefined : sessionStorage,
  tokenKey: 'screen:session',
});
if (!authEnabled) session.clearToken();
const saved = session.getSession();
if (saved?.expiresAt !== undefined && saved.expiresAt <= Date.now()) session.clearToken();
export const authenticated = shallowRef(session.isAuthenticated());
let controller = new AbortController();
let generation = 0;
let expiry: ReturnType<typeof setTimeout> | undefined;
export const getSessionToken = () => session.getToken() || undefined;
export const getSessionSignal = () => controller.signal;
export const getSessionScope = () => String(generation);

function scheduleExpiry() {
  clearTimeout(expiry);
  const expiresAt = session.getSession()?.expiresAt;
  if (expiresAt === undefined) return;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) signOut();
  else expiry = setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
}

export function signOut() {
  generation += 1;
  controller.abort();
  controller = new AbortController();
  clearTimeout(expiry);
  session.clearToken();
  authenticated.value = false;
}

function applySession(data: AuthSessionData, expected: number) {
  if (generation !== expected) throw new Error('会话已切换');
  session.setSession(data);
  authenticated.value = true;
  scheduleExpiry();
}

export async function signIn(username: string, password: string) {
  signOut();
  const expected = generation;
  const data = await authenticate(username, password, controller.signal);
  applySession(data, expected);
}

export async function refreshSession() {
  const expected = generation;
  const data = await refreshAuth(session.getRefreshToken(), controller.signal);
  applySession(data, expected);
}

scheduleExpiry();
if (import.meta.hot) import.meta.hot.dispose(() => signOut());
