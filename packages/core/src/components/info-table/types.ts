export interface InfoTableItem {
  label: string
  value?: unknown
  hidden?: boolean
  span?: number
  emptyText?: string
}

export interface InfoTableProps {
  items: InfoTableItem[]
  columns?: number
  labelWidth?: number | string
  emptyText?: string
  bordered?: boolean
}
