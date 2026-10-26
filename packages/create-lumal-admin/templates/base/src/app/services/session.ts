import { createBackend } from './data-source';
import { createApplicationSession } from './session-runtime';

export const application = createApplicationSession(createBackend, localStorage, sessionStorage);
export const {
  currentUser,
  initialize,
  isAuthenticated,
  login,
  logout,
  permissionStore,
  service,
  tabStorageKey: adminTabSnapshotStorageKey,
} = application;
