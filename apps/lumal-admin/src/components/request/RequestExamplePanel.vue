<script setup lang="ts">
import type { RequestExampleStatus } from '../../composables/useMockRequestExample'
import { ElButton, ElTag } from 'element-plus'
import { computed } from 'vue'

interface Props {
  authorizationHeader: string
  lastUrl: string
  loading: boolean
  message: string
  projectName: string
  projectStatus: string
  sessionExpiredCount: number
  status: RequestExampleStatus
  tokenInjected: boolean
}

interface Emits {
  refresh: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/***********************展示状态*********************/
const statusLabel = computed(() => {
  const labels: Record<RequestExampleStatus, string> = {
    error: '失败',
    idle: '待请求',
    loading: '请求中',
    success: '成功',
  }

  return labels[props.status]
})

const statusType = computed(() => props.status === 'error' ? 'danger' : props.status === 'success' ? 'success' : 'info')
</script>

<template>
  <section class="lumal-request-panel">
    <div class="lumal-request-panel__header">
      <div class="lumal-request-panel__title-group">
        <span class="lumal-request-panel__eyebrow">Request Client</span>
        <h2 class="lumal-request-panel__title">
          请求封装示例
        </h2>
      </div>

      <ElButton
        type="primary"
        :loading="loading"
        @click="emit('refresh')"
      >
        重新请求
      </ElButton>
    </div>

    <div class="lumal-request-panel__meta">
      <div class="lumal-request-panel__item">
        <span class="lumal-request-panel__label">状态</span>
        <ElTag :type="statusType">
          {{ statusLabel }}
        </ElTag>
      </div>
      <div class="lumal-request-panel__item">
        <span class="lumal-request-panel__label">项目</span>
        <strong class="lumal-request-panel__value">{{ projectName }}</strong>
      </div>
      <div class="lumal-request-panel__item">
        <span class="lumal-request-panel__label">业务状态</span>
        <strong class="lumal-request-panel__value">{{ projectStatus }}</strong>
      </div>
      <div class="lumal-request-panel__item">
        <span class="lumal-request-panel__label">Token</span>
        <strong class="lumal-request-panel__value">{{ tokenInjected ? '已注入' : '未注入' }}</strong>
      </div>
    </div>

    <dl class="lumal-request-panel__details">
      <div class="lumal-request-panel__detail">
        <dt class="lumal-request-panel__detail-label">
          请求地址
        </dt>
        <dd class="lumal-request-panel__detail-value">
          {{ lastUrl }}
        </dd>
      </div>
      <div class="lumal-request-panel__detail">
        <dt class="lumal-request-panel__detail-label">
          Authorization
        </dt>
        <dd class="lumal-request-panel__detail-value">
          {{ authorizationHeader }}
        </dd>
      </div>
      <div class="lumal-request-panel__detail">
        <dt class="lumal-request-panel__detail-label">
          会话过期次数
        </dt>
        <dd class="lumal-request-panel__detail-value">
          {{ sessionExpiredCount }}
        </dd>
      </div>
    </dl>

    <p class="lumal-request-panel__message">
      {{ message }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.lumal-request-panel {
  box-sizing: border-box;
  width: min(920px, 100%);
  padding: 24px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: var(--lumal-shadow-base);
}

.lumal-request-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.lumal-request-panel__title-group {
  display: grid;
  gap: 6px;
}

.lumal-request-panel__eyebrow {
  color: var(--el-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.85714286);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.lumal-request-panel__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) * 1.42857143);
  font-weight: 700;
}

.lumal-request-panel__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.lumal-request-panel__item {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.lumal-request-panel__label,
.lumal-request-panel__detail-label {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.85714286);
}

.lumal-request-panel__value {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: var(--lumal-font-size-base, 14px);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lumal-request-panel__details {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
}

.lumal-request-panel__detail {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.lumal-request-panel__detail-value {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-regular);
  font-family:
    "JetBrains Mono",
    Consolas,
    monospace;
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.92857143);
}

.lumal-request-panel__message {
  margin: 18px 0 0;
  color: var(--el-text-color-regular);
  font-size: calc(var(--lumal-font-size-base, 14px) * 0.92857143);
}

@media (max-width: 760px) {
  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-request-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-request-panel__meta {
    grid-template-columns: 1fr;
  }

  :global(html:has(.lumal-layout.is-responsive, .public-layout.is-responsive)) .lumal-request-panel__detail {
    grid-template-columns: 1fr;
  }
}
</style>
