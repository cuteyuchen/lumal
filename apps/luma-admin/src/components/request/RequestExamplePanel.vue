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
  <section class="luma-request-panel">
    <div class="luma-request-panel__header">
      <div class="luma-request-panel__title-group">
        <span class="luma-request-panel__eyebrow">Request Client</span>
        <h2 class="luma-request-panel__title">
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

    <div class="luma-request-panel__meta">
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">状态</span>
        <ElTag :type="statusType">
          {{ statusLabel }}
        </ElTag>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">项目</span>
        <strong class="luma-request-panel__value">{{ projectName }}</strong>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">业务状态</span>
        <strong class="luma-request-panel__value">{{ projectStatus }}</strong>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">Token</span>
        <strong class="luma-request-panel__value">{{ tokenInjected ? '已注入' : '未注入' }}</strong>
      </div>
    </div>

    <dl class="luma-request-panel__details">
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          请求地址
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ lastUrl }}
        </dd>
      </div>
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          Authorization
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ authorizationHeader }}
        </dd>
      </div>
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          会话过期次数
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ sessionExpiredCount }}
        </dd>
      </div>
    </dl>

    <p class="luma-request-panel__message">
      {{ message }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.luma-request-panel {
  box-sizing: border-box;
  width: min(920px, 100%);
  padding: 24px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.luma-request-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.luma-request-panel__title-group {
  display: grid;
  gap: 6px;
}

.luma-request-panel__eyebrow {
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.luma-request-panel__title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.luma-request-panel__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.luma-request-panel__item {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
}

.luma-request-panel__label,
.luma-request-panel__detail-label {
  color: #64748b;
  font-size: 12px;
}

.luma-request-panel__value {
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-request-panel__details {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
}

.luma-request-panel__detail {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.luma-request-panel__detail-value {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #334155;
  font-family:
    "JetBrains Mono",
    Consolas,
    monospace;
  font-size: 13px;
}

.luma-request-panel__message {
  margin: 18px 0 0;
  color: #475569;
  font-size: 13px;
}

@media (max-width: 760px) {
  .luma-request-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .luma-request-panel__meta {
    grid-template-columns: 1fr;
  }

  .luma-request-panel__detail {
    grid-template-columns: 1fr;
  }
}
</style>
