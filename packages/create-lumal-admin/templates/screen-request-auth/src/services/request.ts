import { createRequestClient } from '@lumal/core/request';
import { apiBaseURL, prepareRequest } from './http';
import { getSessionScope, getSessionSignal, getSessionToken, refreshSession, signOut } from './session';

export const request = createRequestClient({
  baseURL: apiBaseURL,
  getToken: getSessionToken,
  getCacheScope: getSessionScope,
  onRequest: ({ init }) => {
    prepareRequest(init);
    init.signal = AbortSignal.any([init.signal!, getSessionSignal()]);
  },
  authRefresh: { refresh: refreshSession },
  onSessionExpired: () => signOut(),
});
