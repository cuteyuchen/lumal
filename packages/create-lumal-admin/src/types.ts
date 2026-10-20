export type AdminPreset = 'minimal' | 'standard' | 'vben-compatible'
export type ApiMode = 'http' | 'local'
export type RouterMode = 'hash' | 'history'
export type AdminFeature = 'examples' | 'system'

export interface CreateLumalAdminProjectOptions {
  apiMode?: ApiMode
  features?: AdminFeature[]
  name: string
  preset?: AdminPreset
  routerMode?: RouterMode
  targetDir: string
}

export interface CreateLumalAdminProjectResult {
  targetDir: string
  createdFiles: string[]
  preset: AdminPreset
  apiMode: ApiMode
  routerMode: RouterMode
  features: AdminFeature[]
}

export interface TemplateFile {
  path: string
  content: string
}
