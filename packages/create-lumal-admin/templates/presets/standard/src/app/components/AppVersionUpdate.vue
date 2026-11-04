<script setup lang="ts">
import type { CreateVersionCheckOptions } from '@lumal/core/composables';
import { useVersionCheck } from '@lumal/core/composables';
import { viewportLength } from '@lumal/viewport';
import { ElButton, ElDialog } from 'element-plus';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { versionCheckOptions } from '../services/version-check';

/***********************版本检查*********************/
const props = defineProps<{
  options?: Partial<CreateVersionCheckOptions>;
}>();

const versionCheck = useVersionCheck({
  ...versionCheckOptions,
  ...props.options,
});

onMounted(() => versionCheck.start());
onBeforeUnmount(() => versionCheck.stop());

const currentVersion = computed(() => props.options?.current?.version ?? versionCheckOptions.current.version);
const nextVersion = computed(() => versionCheck.update.value?.version);
const nextCommit = computed(() => versionCheck.update.value?.commit);
const reloading = ref(false);
const visible = computed({
  get: () => Boolean(versionCheck.update.value),
  set: (value: boolean) => {
    if (!value) versionCheck.dismiss();
  },
});

/***********************事件处理*********************/
function handleDismiss(): void {
  versionCheck.dismiss();
}

async function handleReload(): Promise<void> {
  reloading.value = true;
  try {
    await versionCheck.reload();
  } finally {
    reloading.value = false;
  }
}
</script>

<template>
  <ElDialog
    v-model="visible"
    class="app-version-update"
    title="发现新版本"
    :width="viewportLength(480)"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="app-version-update__body">
      <p class="app-version-update__lead">站点已部署新的构建，当前页面仍在运行旧版本。</p>

      <dl class="app-version-update__meta">
        <template v-if="currentVersion">
          <dt>当前版本</dt>
          <dd>v{{ currentVersion }}</dd>
        </template>
        <template v-if="nextVersion">
          <dt>最新版本</dt>
          <dd>v{{ nextVersion }}</dd>
        </template>
        <template v-if="nextCommit">
          <dt>构建提交</dt>
          <dd>{{ nextCommit }}</dd>
        </template>
      </dl>

      <p class="app-version-update__warning" role="note">
        刷新会重新加载当前页面，未保存的内容将丢失。请先保存正在编辑的内容。
      </p>
    </div>

    <template #footer>
      <ElButton @click="handleDismiss">稍后</ElButton>
      <ElButton type="primary" :loading="reloading" @click="handleReload">立即刷新</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.app-version-update__body {
  display: grid;
  gap: 16px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.app-version-update__lead {
  margin: 0;
  color: var(--el-text-color-primary);
}

.app-version-update__meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-lighter);
}

.app-version-update__meta dt {
  color: var(--el-text-color-secondary);
}

.app-version-update__meta dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.app-version-update__warning {
  margin: 0;
  color: var(--el-color-warning);
}
</style>
