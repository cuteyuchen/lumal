import { createRequestClient } from '@lumal/core/request';

/** 可在这里配置成功码或字段映射；默认协议直接返回 JSON，不猜测业务包装。 */
export const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export function prepareRequest(init: RequestInit) {
  if (!apiBaseURL) throw new Error('请配置 VITE_API_BASE_URL');
  const signals = [AbortSignal.timeout(15_000)];
  if (init.signal) signals.push(init.signal);
  init.signal = AbortSignal.any(signals);
}

// 登录/刷新用独立客户端，401 不触发已登录会话的退出或递归刷新。
export const publicRequest = createRequestClient({
  baseURL: apiBaseURL,
  onRequest: ({ init }) => prepareRequest(init),
});
