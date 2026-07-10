import type { App } from 'vue'

/***********************组件安装包装*********************/
export type WithInstall<T> = T & { install: (app: App) => void }

/**
 * 组件 install 包装：让组件既可具名导入，又可通过 `app.use(Comp)` 单独注册。
 * 组件需带 `name`（或 SFC 的 `__name`）；否则可用 alias 显式指定注册名。
 */
export function withInstall<T extends Record<string, unknown>>(component: T, alias?: string): WithInstall<T> {
  const installable = component as WithInstall<T>

  installable.install = function install(app: App): void {
    const name = alias
      ?? (component as { name?: string }).name
      ?? (component as { __name?: string }).__name

    if (!name) {
      return
    }

    app.component(name, component as never)
  }

  return installable
}
