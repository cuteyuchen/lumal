<script setup lang="ts">
import type { PermissionNode } from '../../../../app/module';
import type { Role } from '../types';
import { viewportLength } from '@lumal/viewport';
import { ElAlert, ElButton, ElDialog, ElTree } from 'element-plus';
import { nextTick, shallowRef, useTemplateRef, watch } from 'vue';
import { collectPermissions } from '../../../../app/module';
import { application, service } from '../../../../app/services/session';
import { createRoleService } from '../api';

/***********************授权树加载与回显*********************/
const props = defineProps<{ role: Role }>();
const visible = defineModel<boolean>({ required: true });
const api = createRoleService(service);
const tree = useTemplateRef<InstanceType<typeof ElTree>>('tree');
const nodes = shallowRef<PermissionNode[]>([]);
const loading = shallowRef(false);
const saving = shallowRef(false);
const saved = shallowRef(false);
const failure = shallowRef('');
let generation = 0;
function flatten(items: PermissionNode[]): PermissionNode[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}
async function load(): Promise<void> {
  const version = ++generation;
  loading.value = true;
  failure.value = '';
  saved.value = false;
  try {
    const [next, granted] = await Promise.all([api.tree(), api.permissions(props.role.code)]);
    if (version !== generation || !visible.value) return;
    nodes.value = next;
    await nextTick();
    tree.value?.setCheckedKeys(
      flatten(next)
        .filter((node) => node.permission && granted.includes(node.permission))
        .map((node) => node.id),
    );
  } catch (reason) {
    if (version === generation) failure.value = reason instanceof Error ? reason.message : '授权加载失败';
  } finally {
    if (version === generation) loading.value = false;
  }
}
watch(
  visible,
  (open) => {
    if (open) void load();
    else generation += 1;
  },
  { immediate: true },
);

/***********************保存与部分成功恢复*********************/
async function save(): Promise<void> {
  if (saving.value || loading.value || !tree.value) return;
  saving.value = true;
  failure.value = '';
  try {
    if (!saved.value) {
      const keys = new Set([...tree.value.getCheckedKeys(false), ...tree.value.getHalfCheckedKeys()].map(String));
      const known = new Set(collectPermissions(nodes.value));
      const permissions = flatten(nodes.value)
        .filter((node) => keys.has(node.id) && node.permission && known.has(node.permission))
        .map((node) => node.permission!);
      await api.authorize(props.role.code, permissions);
      saved.value = true;
    }
    // 授权写入和当前账号权限重读不是事务，失败时只重试重读。
    await application.refreshAccess();
    visible.value = false;
  } catch (reason) {
    failure.value = `${saved.value ? '授权已保存，但会话刷新失败。可重试刷新：' : ''}${reason instanceof Error ? reason.message : '授权保存失败'}`;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="`角色授权：${role.name}`"
    :width="viewportLength(600)"
    append-to-body
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
  >
    <ElAlert v-if="failure" :title="failure" type="error" :closable="false" role="alert" />
    <ElButton :disabled="loading || saving" @click="load"> 重新读取 </ElButton>
    <ElTree
      ref="tree"
      :data="nodes"
      node-key="id"
      show-checkbox
      default-expand-all
      :props="{
        label: 'label',
        children: 'children',
        disabled: () => loading || saving || saved || role.code === 'admin',
      }"
    />
    <template #footer>
      <ElButton :disabled="saving" @click="visible = false"> 关闭 </ElButton>
      <ElButton type="primary" :loading="saving" :disabled="loading || !nodes.length" @click="save">
        {{ saved ? '重试刷新' : '保存授权' }}
      </ElButton>
    </template>
  </ElDialog>
</template>
