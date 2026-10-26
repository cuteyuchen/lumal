import type { PermissionNode } from '../../../app/module';
import { object, text } from '../../../shared/api';

/** 将非叶节点的访问权限拆成独立叶子，避免回显父权限时误授予全部按钮权限。 */
export function parsePermissionTree(value: unknown): PermissionNode[] {
  const ids = new Set<string>();
  const seen = new WeakSet<object>();
  let count = 0;
  function visit(value: unknown, depth: number): PermissionNode[] {
    if (!Array.isArray(value) || depth > 30) throw new Error('权限树必须是有限层级的数组');
    return value.map((item) => {
      const raw = object(item);
      const id = text(raw.id, '权限节点 ID', true);
      if (++count > 1000 || seen.has(raw) || ids.has(id)) throw new Error('权限树存在循环、重复节点或超过数量限制');
      ids.add(id);
      seen.add(raw);
      const label = text(raw.label, '权限标题', true);
      const permission = raw.permission === undefined ? undefined : text(raw.permission, '权限码', true);
      const children = raw.children === undefined ? [] : visit(raw.children, depth + 1);
      if (!children.length) return { id: `permission:${id}`, label, permission };
      return {
        id: `group:${id}`,
        label,
        children: permission
          ? [{ id: `permission:${id}`, label: `${label}（访问）`, permission }, ...children]
          : children,
      };
    });
  }
  return visit(value, 0);
}
