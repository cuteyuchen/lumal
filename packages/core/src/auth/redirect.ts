import type { RedirectOptions } from './types'

/***********************登录跳转解析*********************/
/**
 * 解析登录跳转地址：把当前路径写入 redirect 查询参数，便于登录后回跳。
 * 当前路径为空或已是登录页时，直接返回登录页路径。
 */
export function resolveLoginRedirect(currentPath: string, options: RedirectOptions = {}): string {
  const loginPath = options.loginPath ?? '/login'
  const redirectQueryKey = options.redirectQueryKey ?? 'redirect'
  const normalizedPath = currentPath.trim()

  if (!normalizedPath || normalizedPath === loginPath) {
    return loginPath
  }

  const url = new URL(loginPath, 'http://luma.local')
  url.searchParams.set(redirectQueryKey, normalizedPath)
  return `${url.pathname}${url.search}`
}
