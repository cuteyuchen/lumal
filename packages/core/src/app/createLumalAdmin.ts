import type {
  CreateLumalAdminOptions,
  LumalAdminInstance,
  LumalElementPlusOptions,
} from './types'
import { registerStaticLocalSvgIcons } from '@lumal/icons'
import { createApp } from 'vue'
import { installDictionary } from '../dictionary'
import { permissionStoreKey } from '../permission/context'
import { defaultLumalComponents } from './default-components'

/***********************选项归一化*********************/
function resolveOptions(options: CreateLumalAdminOptions): CreateLumalAdminOptions {
  const preset = options.preset ?? 'admin-default'

  if (preset === 'minimal') {
    return {
      ...options,
      components: options.components ?? true,
      dictionary: options.dictionary ?? false,
      preset,
    }
  }

  return {
    ...options,
    components: options.components ?? true,
    preset,
  }
}

function isElementPlusOptions(
  input: CreateLumalAdminOptions['elementPlus'],
): input is LumalElementPlusOptions {
  return Boolean(input && typeof input === 'object' && 'plugin' in input)
}

/***********************插件安装*********************/
function installCorePlugins(app: LumalAdminInstance['app'], options: CreateLumalAdminOptions): void {
  if (options.dictionary !== false) {
    installDictionary(app, options.dictionary)
  }

  // Pinia 必须先于 Router 安装，避免首次导航守卫读取尚未激活的 store。
  if (options.pinia) {
    app.use(options.pinia)
  }

  if (options.router) {
    app.use(options.router)
  }

  if (options.elementPlus) {
    if (isElementPlusOptions(options.elementPlus)) {
      app.use(options.elementPlus.plugin, options.elementPlus.options)
    }
    else {
      app.use(options.elementPlus)
    }
  }
}

/***********************组件注册*********************/
function registerGlobalComponents(app: LumalAdminInstance['app'], options: CreateLumalAdminOptions): void {
  const components = options.components

  if (components === false) {
    return
  }

  const selected = components === true || components === undefined
    ? defaultLumalComponents
    : Array.isArray(components)
      ? Object.fromEntries(
          components
            .filter(name => Boolean(defaultLumalComponents[name]))
            .map(name => [name, defaultLumalComponents[name]]),
        )
      : components

  Object.entries(selected).forEach(([name, component]) => {
    app.component(name, component)
  })
}

/***********************应用创建*********************/
export function createLumalAdmin(options: CreateLumalAdminOptions): LumalAdminInstance {
  const resolvedOptions = resolveOptions(options)
  const app = createApp(resolvedOptions.rootComponent, resolvedOptions.rootProps)

  if (resolvedOptions.permissionStore) {
    app.provide(permissionStoreKey, resolvedOptions.permissionStore)
  }

  if (resolvedOptions.icons?.localSvg?.length) {
    registerStaticLocalSvgIcons(resolvedOptions.icons.localSvg)
  }

  installCorePlugins(app, resolvedOptions)
  registerGlobalComponents(app, resolvedOptions)

  const context = {
    app,
    permissionStore: resolvedOptions.permissionStore,
    pinia: resolvedOptions.pinia,
    router: resolvedOptions.router,
  }
  let preparePromise: Promise<void> | undefined

  function prepare(): Promise<void> {
    preparePromise ??= Promise.resolve()
      .then(() => resolvedOptions.setup?.(context))
      .then(() => resolvedOptions.router?.isReady?.())

    return preparePromise
  }

  const instance: LumalAdminInstance = {
    ...context,
    async mount(container) {
      await prepare()
      return app.mount(container)
    },
    use(plugin, ...pluginOptions) {
      app.use(plugin as import('vue').Plugin<unknown[]>, ...pluginOptions)
      return instance
    },
  }

  return instance
}
