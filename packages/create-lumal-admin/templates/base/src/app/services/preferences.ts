import type { LumalPreferencesDefaults } from '@lumal/core/theme';
import { createPreferencesStore } from '@lumal/core/theme';
import { appConfig } from '../../app.config';

export const adminPreferenceDefaults = {
  app: { dynamicTitle: true, layout: 'sidebar-nav' },
  breadcrumb: { enable: true, hideOnlyOne: false, showHome: true, showIcon: true },
  header: { globalSearch: true },
  shortcutKeys: { globalSearch: true },
  sidebar: { width: 220 },
  tabbar: {
    cache: appConfig.preset !== 'minimal',
    draggable: true,
    enable: appConfig.preset !== 'minimal',
    maxCount: 0,
    middleClickToClose: true,
    persist: true,
    showIcon: true,
    showMaximize: true,
    showMore: true,
    showRefresh: true,
    styleType: 'chrome',
    visitHistory: true,
    wheelable: true,
  },
  theme: { fontSize: 14 },
  transition: { enable: true, name: 'fade-side' },
} satisfies LumalPreferencesDefaults;

const preferencesStore = createPreferencesStore({
  defaults: adminPreferenceDefaults,
  storage: localStorage,
  storageKey: 'lumal-admin:preferences',
});

export const adminPreferences = preferencesStore.state;
export const adminResolvedThemeMode = preferencesStore.resolvedThemeMode;

export function patchAdminPreferences(preferences: Parameters<typeof preferencesStore.patch>[0]): void {
  preferencesStore.patch(preferences);
}
