import type { Status } from '../../../shared/api'

export interface DictionaryTypeInput { name: string, code: string, description: string, status: Status }
export interface DictionaryType extends DictionaryTypeInput { id: string }
export interface DictionaryItemInput { typeCode: string, label: string, value: string, color: string, order: number, status: Status }
export interface DictionaryItem extends DictionaryItemInput { id: string }
