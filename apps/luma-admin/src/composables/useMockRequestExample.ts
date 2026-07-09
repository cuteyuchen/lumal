import type { RequestContext } from '@luma/core/request'
import { createRequestClient } from '@luma/core/request'
import { computed, readonly, shallowRef } from 'vue'

export type RequestExampleStatus = 'error' | 'idle' | 'loading' | 'success'

interface ProjectSummary {
  id: string
  name: string
  status: 'disabled' | 'enabled'
  updatedAt: string
}

interface ApiResponse<TData> {
  code: number
  data: TData
  message: string
}

/***********************Mock 服务*********************/
function createJsonResponse<TData>(payload: ApiResponse<TData>, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json',
    },
    status: 200,
    ...init,
  })
}

function resolveRequestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.toString()
  }

  return input.url
}

/***********************请求示例*********************/
export function useMockRequestExample() {
  const status = shallowRef<RequestExampleStatus>('idle')
  const message = shallowRef('等待发起请求')
  const lastUrl = shallowRef('-')
  const authorizationHeader = shallowRef('未请求')
  const sessionExpiredCount = shallowRef(0)
  const project = shallowRef<ProjectSummary | null>(null)

  const mockFetch: typeof fetch = async (input, init) => {
    lastUrl.value = resolveRequestUrl(input)
    authorizationHeader.value = new Headers(init?.headers).get('Authorization') ?? '未注入'

    return createJsonResponse({
      code: 0,
      data: {
        id: 'demo-001',
        name: 'Luma 示例项目',
        status: 'enabled',
        updatedAt: '2026-07-09 21:00',
      },
      message: 'ok',
    })
  }

  const request = createRequestClient({
    baseURL: '/mock-api',
    fetch: mockFetch,
    getToken: () => 'mock-token-001',
    onResponse: <TResult>(context: RequestContext) => {
      const payload = context.data as ApiResponse<ProjectSummary>

      if (payload.code !== 0) {
        throw new Error(payload.message || '请求失败')
      }

      return payload.data as TResult
    },
    onSessionExpired: () => {
      sessionExpiredCount.value += 1
    },
  })

  const loading = computed(() => status.value === 'loading')
  const projectName = computed(() => project.value?.name ?? '暂无数据')
  const projectStatus = computed(() => project.value?.status === 'enabled' ? '启用' : '停用')
  const tokenInjected = computed(() => authorizationHeader.value.startsWith('Bearer '))

  async function loadProjectSummary(): Promise<void> {
    status.value = 'loading'
    message.value = '正在请求项目摘要'

    try {
      project.value = await request.get<ProjectSummary>('/projects/summary', {
        query: {
          scene: 'admin-demo',
        },
      })
      status.value = 'success'
      message.value = '请求成功，已完成 token 注入和响应解析'
    }
    catch (error) {
      status.value = 'error'
      message.value = error instanceof Error ? error.message : '请求失败'
    }
  }

  return {
    authorizationHeader: readonly(authorizationHeader),
    lastUrl: readonly(lastUrl),
    loadProjectSummary,
    loading,
    message: readonly(message),
    project: readonly(project),
    projectName,
    projectStatus,
    sessionExpiredCount: readonly(sessionExpiredCount),
    status: readonly(status),
    tokenInjected,
  }
}
