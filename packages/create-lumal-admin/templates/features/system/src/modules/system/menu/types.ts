export type MenuType = 'directory' | 'menu' | 'button' | 'external' | 'embedded'
export interface MenuInput {
  parentId: string
  type: MenuType
  title: string
  path: string
  name: string
  component: string
  icon: string
  order: number
  hidden: boolean
  permissions: string[]
  externalLink: string
}
export interface Menu extends MenuInput { id: string, children?: Menu[] }
