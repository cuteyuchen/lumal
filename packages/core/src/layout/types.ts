export interface LumaLayoutMenuItem {
  path: string
  title: string
  children?: LumaLayoutMenuItem[]
  icon?: string
}

export interface LumaLayoutTabItem {
  path: string
  title: string
  closable?: boolean
}
