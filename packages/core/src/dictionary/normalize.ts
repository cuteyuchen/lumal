import type {
  DictionaryFieldNames,
  DictionaryLabelValue,
  DictionaryOption,
  DictionaryValue,
  NormalizeDictionaryOptions,
} from './types'

/***********************基础判断*********************/
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOwnKey(target: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(target, key)
}

function readField(source: Record<string, unknown>, field: string | undefined): unknown {
  return field ? source[field] : undefined
}

/***********************选项归一化*********************/
function normalizeDictionaryValue(value: unknown): DictionaryValue {
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value == null ? '' : String(value)
}

function normalizeOption(input: unknown, fieldNames: DictionaryFieldNames = {}): DictionaryOption | undefined {
  if (!isRecord(input)) {
    return undefined
  }

  const labelField = fieldNames.label ?? 'label'
  const valueField = fieldNames.value ?? 'value'
  const disabledField = fieldNames.disabled ?? 'disabled'
  const childrenField = fieldNames.children ?? 'children'
  const colorField = fieldNames.color ?? 'color'
  const rawValue = readField(input, valueField)
  const value = normalizeDictionaryValue(rawValue)
  const rawLabel = readField(input, labelField)
  const rawChildren = readField(input, childrenField)
  const children = Array.isArray(rawChildren)
    ? normalizeDictionaryOptionList(rawChildren, fieldNames)
    : undefined
  const option: DictionaryOption = {
    label: rawLabel == null ? String(value) : String(rawLabel),
    value,
  }

  if (hasOwnKey(input, disabledField)) {
    option.disabled = Boolean(readField(input, disabledField))
  }

  if (typeof readField(input, colorField) === 'string') {
    option.color = String(readField(input, colorField))
  }

  if (children?.length) {
    option.children = children
  }

  if (isRecord(input.meta)) {
    option.meta = input.meta
  }

  return option
}

export function normalizeDictionaryOptionList(
  input: unknown[],
  fieldNames: DictionaryFieldNames = {},
): DictionaryOption[] {
  return input
    .map(item => normalizeOption(item, fieldNames))
    .filter((item): item is DictionaryOption => Boolean(item))
}

export function normalizeDictionaryOptions(
  response: unknown,
  options: NormalizeDictionaryOptions = {},
  dictionary?: string,
): DictionaryOption[] {
  if (options.parseResponse) {
    return normalizeDictionaryOptionList(options.parseResponse(response, dictionary), options.fieldNames)
  }

  if (!isRecord(response)) {
    return []
  }

  const itemsField = options.fieldNames?.items ?? 'items'
  const items = response[itemsField]

  if (!Array.isArray(items)) {
    return []
  }

  return normalizeDictionaryOptionList(items, options.fieldNames)
}

/***********************标签翻译*********************/
function resolveLabelFromOptions(
  options: readonly DictionaryOption[],
  value: DictionaryLabelValue,
): string {
  if (value === undefined || value === null) {
    return '-'
  }

  const values = Array.isArray(value) ? value : [value]

  if (values.length === 0) {
    return '-'
  }

  return values.map((currentValue) => {
    const found = options.find(item => String(item.value) === String(currentValue))
    return found?.label ?? String(currentValue)
  }).join(', ')
}

export function getDictionaryLabel(
  options: readonly DictionaryOption[],
  value: DictionaryLabelValue,
): string {
  return resolveLabelFromOptions(options, value)
}
