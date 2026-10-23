import type { ScreenMetric } from './metrics-types';
import { request } from './request';

export async function loadMetrics(signal?: AbortSignal): Promise<ScreenMetric[]> {
  const data = await request.get<unknown>('/screen/metrics', { signal });
  if (
    !Array.isArray(data) ||
    !data.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.label === 'string' &&
        typeof item.value === 'number' &&
        Number.isFinite(item.value),
    )
  ) {
    throw new Error('指标响应不符合 API-CONTRACT.md');
  }
  return data as ScreenMetric[];
}
