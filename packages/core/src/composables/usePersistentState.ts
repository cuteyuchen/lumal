import type { Ref } from 'vue'
import type { JsonValue, StorageAccessor } from '../utils/types'
import { ref, watch } from 'vue'

/***********************持久化状态*********************/
/**
 * 与存储双向同步的响应式状态：初始化时读取存储，变更时写回。
 * 依赖 utils 的 StorageAccessor，可注入 localStorage/sessionStorage 包装或自定义实现。
 */
export function usePersistentState<T extends JsonValue>(
  storage: StorageAccessor,
  key: string,
  initialValue: T,
): Ref<T> {
  const fromStorage = storage.get<T>(key)
  const state = ref(fromStorage ?? initialValue) as Ref<T>

  watch(
    state,
    (value) => {
      storage.set(key, value)
    },
    { deep: true },
  )

  return state
}
