// 保留旧模块路径；实现与模板资源分离，避免破坏已有编程消费者。
export { createLumalAdminProject } from './create.js'
export type { CreateLumalAdminProjectOptions, CreateLumalAdminProjectResult } from './types.js'
