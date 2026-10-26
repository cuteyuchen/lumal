import type { ScreenMetric } from './metrics-types';

/** 明确的本地示例，不会在 HTTP 失败时被调用。 */
export async function loadMetrics(signal?: AbortSignal): Promise<ScreenMetric[]> {
  signal?.throwIfAborted();
  return [
    { label: '任务总数', value: 128 },
    { label: '已完成', value: 96 },
    { label: '进行中', value: 32 },
  ];
}
