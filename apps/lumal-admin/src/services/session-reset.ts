/***********************会话依赖清理*********************/
// 独立保存回调，避免 session -> auth API -> request 的初始化循环读取未就绪状态。
const handlers = new Set<() => void>()

export function registerSessionResetHandler(handler: () => void): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function resetSessionDependents(): void {
  handlers.forEach(handler => handler())
}
