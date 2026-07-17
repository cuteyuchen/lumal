/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DATAV_GUIDE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
