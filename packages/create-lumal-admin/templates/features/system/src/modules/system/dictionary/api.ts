import type { SchemaFormModel } from '@lumal/core/components';
import type { BusinessTransport } from '../../../app/services/contracts';
import type { DictionaryItem, DictionaryItemInput, DictionaryType, DictionaryTypeInput } from './types';
import { formStatus, integer, object, rows, text } from '../../../shared/api';

export function dictionaryTypeInput(model: SchemaFormModel): DictionaryTypeInput {
  return {
    name: text(model.name, '字典名称', true),
    code: text(model.code, '字典编码', true),
    description: text(model.description, '说明'),
    status: formStatus(model),
  };
}
export function dictionaryItemInput(model: SchemaFormModel): DictionaryItemInput {
  const color = text(model.color, '颜色');
  if (color && !/^#[\da-f]{6}$/i.test(color)) throw new Error('颜色必须是六位十六进制值');
  return {
    typeCode: text(model.typeCode, '字典分类', true),
    label: text(model.label, '显示名称', true),
    value: text(model.value, '字典值', true),
    color,
    order: integer(model.order ?? 0),
    status: formStatus(model),
  };
}
export function parseType(value: unknown): DictionaryType {
  const raw = object(value);
  return { ...dictionaryTypeInput(raw), id: text(raw.id, '字典 ID', true) };
}
export function parseItem(value: unknown): DictionaryItem {
  const raw = object(value);
  return { ...dictionaryItemInput(raw), id: text(raw.id, '字典项 ID', true) };
}
export function createDictionaryService(transport: BusinessTransport, invalidate: () => void = () => {}) {
  async function mutation<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    input: object | undefined,
    parse: (value: unknown) => T,
  ) {
    const result = await transport.request(method, path, { body: input });
    // 先使旧请求失效再刷新消费者，防止旧字典响应回填。
    invalidate();
    return parse(result);
  }
  return {
    types: async () => rows(await transport.request('GET', '/system/dictionaries/types'), parseType),
    items: async (typeCode: string) =>
      rows(await transport.request('GET', '/system/dictionaries/items', { query: { typeCode } }), parseItem),
    createType: (input: DictionaryTypeInput) => mutation('POST', '/system/dictionaries/types', input, parseType),
    updateType: (id: string, input: DictionaryTypeInput) =>
      mutation('PUT', `/system/dictionaries/types/${encodeURIComponent(id)}`, input, parseType),
    removeType: (id: string) =>
      mutation('DELETE', `/system/dictionaries/types/${encodeURIComponent(id)}`, undefined, () => undefined),
    createItem: (input: DictionaryItemInput) => mutation('POST', '/system/dictionaries/items', input, parseItem),
    updateItem: (id: string, input: DictionaryItemInput) =>
      mutation('PUT', `/system/dictionaries/items/${encodeURIComponent(id)}`, input, parseItem),
    removeItem: (id: string) =>
      mutation('DELETE', `/system/dictionaries/items/${encodeURIComponent(id)}`, undefined, () => undefined),
  };
}
