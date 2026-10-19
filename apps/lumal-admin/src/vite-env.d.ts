/// <reference types="vite/client" />

declare const __LUMAL_ADMIN_BUILD_INFO__: import('./services/app-info').AdminBuildInfo

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_COCKPIT_URL?: string
  readonly VITE_DATAV_GUIDE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
