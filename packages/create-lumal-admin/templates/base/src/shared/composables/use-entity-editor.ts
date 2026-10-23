import type { SchemaFormModel } from '@lumal/core/components';
import { ElMessage, ElMessageBox } from 'element-plus';
import { shallowRef } from 'vue';

interface EditorOptions<T extends { id: string }, Input> {
  create: (input: Input) => Promise<unknown>;
  update: (id: string, input: Input) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  toInput: (model: SchemaFormModel) => Input;
  reload: () => Promise<void>;
  removeMessage?: (record: T) => string;
}
export function useEntityEditor<T extends { id: string }, Input>(options: EditorOptions<T, Input>) {
  const visible = shallowRef(false);
  const model = shallowRef<SchemaFormModel>({});
  const editing = shallowRef<T>();
  const saving = shallowRef(false);
  const error = shallowRef('');
  function openCreate(initial: SchemaFormModel = {}): void {
    editing.value = undefined;
    model.value = structuredClone(initial);
    error.value = '';
    visible.value = true;
  }
  function openEdit(record: T): void {
    editing.value = record;
    model.value = structuredClone(record) as SchemaFormModel;
    error.value = '';
    visible.value = true;
  }
  async function submit(values: SchemaFormModel): Promise<void> {
    if (saving.value) return;
    saving.value = true;
    error.value = '';
    let persisted = false;
    try {
      const input = options.toInput(values);
      if (editing.value) await options.update(editing.value.id, input);
      else await options.create(input);
      persisted = true;
      visible.value = false;
      await options.reload();
      ElMessage.success('保存成功');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '操作失败';
      error.value = persisted ? `保存已完成，但刷新失败：${message}。请重新加载，不要重复提交。` : message;
    } finally {
      saving.value = false;
    }
  }
  async function remove(record: T): Promise<void> {
    if (saving.value) return;
    try {
      await ElMessageBox.confirm(options.removeMessage?.(record) ?? '确定删除该记录？', '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      });
    } catch {
      return;
    }
    saving.value = true;
    error.value = '';
    let persisted = false;
    try {
      await options.remove(record.id);
      persisted = true;
      await options.reload();
      ElMessage.success('删除成功');
    } catch (reason) {
      error.value = `${persisted ? '删除已完成，但刷新失败：' : ''}${reason instanceof Error ? reason.message : '删除失败'}`;
    } finally {
      saving.value = false;
    }
  }
  return { visible, model, editing, saving, error, openCreate, openEdit, submit, remove };
}
