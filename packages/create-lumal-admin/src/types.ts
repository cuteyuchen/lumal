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
  /** 取消创建时仅回滚本次拥有的文件。 */
  signal?: AbortSignal
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

/***********************通用项目生成协议*********************/
export type ProjectTemplate = 'admin' | 'blank' | 'screen'
export type ScreenAuth = 'none' | 'local-demo' | 'http'
export type ScreenData = 'none' | 'local' | 'http'
export type ScreenVisualization = 'none' | 'charts' | 'datav' | 'cockpit'
export type ScreenViewport = 'disabled' | 'responsive' | 'width' | 'contain' | 'scale' | 'vw'
export type ProjectRouterMode = RouterMode | 'none'

export interface CreateLumalProjectOptions {
  targetDir: string
  name: string
  template?: ProjectTemplate
  preset?: AdminPreset
  apiMode?: ApiMode
  features?: AdminFeature[]
  routerMode?: ProjectRouterMode
  auth?: ScreenAuth
  data?: ScreenData
  visualization?: ScreenVisualization
  viewport?: ScreenViewport
  signal?: AbortSignal
}

export interface ResolvedScreenOptions {
  template: 'blank' | 'screen'
  name: string
  targetDir: string
  auth: ScreenAuth
  data: ScreenData
  routerMode: ProjectRouterMode
  visualization: ScreenVisualization
  viewport: ScreenViewport
  signal?: AbortSignal
}

export type CreateLumalProjectResult = (ResolvedScreenOptions | (CreateLumalAdminProjectResult & { template: 'admin' })) & {
  createdFiles: string[]
}
