/***********************构建元信息类型*********************/
export interface AdminBuildInfo {
  builtAt: string
  commit: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  license: string
  mode: string
  version: string
}

/***********************客户端构建快照*********************/
// 由 Vite 在构建时替换，不在浏览器读取 package.json 或查询 npm 最新版本。
export const adminBuildInfo: AdminBuildInfo = __LUMAL_ADMIN_BUILD_INFO__
