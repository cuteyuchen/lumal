/// <reference types="vite/client" />

declare const __LUMAL_ADMIN_BUILD_INFO__: import('./services/app-info').AdminBuildInfo
declare const __LUMAL_VERSION_INFO__: import('@lumal/core/composables').LumalVersionInfo

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_COCKPIT_URL?: string
  readonly VITE_DATAV_GUIDE_URL?: string
  readonly VITE_VERSION_CHECK?: string
  readonly VITE_VERSION_CHECK_INTERVAL?: string
  readonly VITE_VERSION_CHECK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
