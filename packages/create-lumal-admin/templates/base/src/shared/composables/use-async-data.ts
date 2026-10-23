import { onActivated, onDeactivated, onMounted, onScopeDispose, shallowRef } from 'vue';

export function useAsyncData<T>(fetcher: () => Promise<T>, initial: T) {
  const data = shallowRef(initial);
  const loading = shallowRef(false);
  const error = shallowRef('');
  let generation = 0;
  let reactivating = false;
  async function load(): Promise<void> {
    const version = ++generation;
    loading.value = true;
    error.value = '';
    try {
      const next = await fetcher();
      if (version === generation) data.value = next;
    } catch (reason) {
      if (version === generation) error.value = reason instanceof Error ? reason.message : '加载失败';
      throw reason;
    } finally {
      if (version === generation) loading.value = false;
    }
  }
  const reload = () => load().catch(() => {}); // 错误已保留供页面显示和重试。
  onMounted(reload);
  onDeactivated(() => {
    reactivating = true;
  });
  onActivated(() => {
    if (reactivating) void reload();
  });
  onScopeDispose(() => {
    generation += 1;
  });
  return { data, loading, error, load, reload };
}
