export interface TreeItem { id: string, parentId: string }

export function assertHierarchy<T extends TreeItem>(items: T[]): void {
  const byId = new Map(items.map(item => [item.id, item]))
  if (byId.size !== items.length)
    throw new Error('树节点 ID 重复')
  for (const item of items) {
    const visited = new Set([item.id])
    let parent = item.parentId
    while (parent) {
      if (visited.has(parent))
        throw new Error('父子关系形成循环')
      const found = byId.get(parent)
      if (!found)
        throw new Error('父节点不存在')
      visited.add(parent)
      parent = found.parentId
    }
  }
}
export function buildTree<T extends TreeItem>(items: T[], parentId = ''): (T & { children: (T & { children?: T[] })[] })[] {
  return items.filter(item => item.parentId === parentId).map(item => ({ ...item, children: buildTree(items, item.id) }))
}
export function flattenTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap(item => [item, ...flattenTree(item.children ?? [])])
}
export function excludedDescendants<T extends TreeItem>(items: T[], id?: string): Set<string> {
  const excluded = new Set<string>()
  function visit(current?: string): void {
    if (!current || excluded.has(current))
      return
    excluded.add(current)
    items.filter(item => item.parentId === current).forEach(item => visit(item.id))
  }
  visit(id)
  return excluded
}
