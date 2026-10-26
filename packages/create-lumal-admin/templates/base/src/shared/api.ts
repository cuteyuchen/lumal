import type { SchemaFormModel } from '@lumal/core/components';
import { object, stringArray } from '../app/menu-policy';

export type Status = 'enabled' | 'disabled';
export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
  children?: Option[];
}
export interface Query {
  keyword?: string;
  status?: Status | '';
}
export interface PageInput<Q = Query> {
  page: number;
  pageSize: number;
  query: Q;
}
export { object, stringArray };

export function text(value: unknown, label: string, required = false): string {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || (required && !value.trim()))
    throw new Error(`${label}必须是${required ? '非空' : ''}字符串`);
  return value.trim();
}
export function status(value: unknown): Status {
  if (value !== 'enabled' && value !== 'disabled') throw new Error('状态仅支持 enabled / disabled');
  return value;
}
export function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('排序必须是非负整数');
  return value;
}
export function rows<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('列表响应必须是数组');
  return value.map(parse);
}
export function options(value: unknown): Option[] {
  return rows(value, (item) => {
    const raw = object(item);
    return {
      label: text(raw.label, '选项名称', true),
      value: text(raw.value, '选项值', true),
      disabled: raw.disabled === true,
      children: raw.children === undefined ? undefined : options(raw.children),
    };
  });
}
export function formStatus(model: SchemaFormModel): Status {
  return status(model.status ?? 'enabled');
}
