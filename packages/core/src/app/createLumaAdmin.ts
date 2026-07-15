import type {
  CreateLumaAdminOptions,
  LumaAdminInstance,
  LumaElementPlusOptions,
} from './types'
import { registerStaticLocalSvgIcons } from '@luma/icons'
import { createApp } from 'vue'
import { installDictionary } from '../dictionary'
import { permissionStoreKey } from '../permission/context'
import { defaultLumaComponents } from './default-components'

/***********************选项归一化*********************/
function resolveOptions(options: CreateLumaAdminOptions): CreateLumaAdminOptions {
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
  input: CreateLumaAdminOptions['elementPlus'],
): input is LumaElementPlusOptions {
  return Boolean(input && typeof input === 'object' && 'plugin' in input)
}

/***********************插件安装*********************/
function installCorePlugins(app: LumaAdminInstance['app'], options: CreateLumaAdminOptions): void {
  if (options.dictionary !== false) {
    installDictionary(app, options.dictionary)
  }

  if (options.router) {
    app.use(options.router)
  }

  if (options.pinia) {
    app.use(options.pinia)
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
function registerGlobalComponents(app: LumaAdminInstance['app'], options: CreateLumaAdminOptions): void {
  const components = options.components

  if (components === false) {
    return
  }

  const selected = components === true || components === undefined
    ? defaultLumaComponents
    : Array.isArray(components)
      ? Object.fromEntries(
          components
            .filter(name => Boolean(defaultLumaComponents[name]))
            .map(name => [name, defaultLumaComponents[name]]),
        )
      : components

  Object.entries(selected).forEach(([name, component]) => {
    app.component(name, component)
  })
}

/***********************应用创建*********************/
export function createLumaAdmin(options: CreateLumaAdminOptions): LumaAdminInstance {
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

  const instance: LumaAdminInstance = {
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
