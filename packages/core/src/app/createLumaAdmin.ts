import type { CreateLumaAdminOptions, LumaAdminInstance } from './types'
import { registerStaticLocalSvgIcons } from '@luma/icons'
import { createApp } from 'vue'
import { installDictionary } from '../dictionary'

/***********************插件安装*********************/
function installCorePlugins(app: LumaAdminInstance['app'], options: CreateLumaAdminOptions): void {
  if (options.router) {
    app.use(options.router)
  }

  if (options.pinia) {
    app.use(options.pinia)
  }

  if (options.elementPlus) {
    app.use(options.elementPlus)
  }

  if (options.dictionary !== false) {
    installDictionary(app, options.dictionary)
  }
}

/***********************组件注册*********************/
function registerGlobalComponents(app: LumaAdminInstance['app'], options: CreateLumaAdminOptions): void {
  Object.entries(options.components ?? {}).forEach(([name, component]) => {
    app.component(name, component)
  })
}

/***********************应用创建*********************/
export function createLumaAdmin(options: CreateLumaAdminOptions): LumaAdminInstance {
  const app = createApp(options.rootComponent, options.rootProps)

  if (options.icons?.localSvg?.length) {
    registerStaticLocalSvgIcons(options.icons.localSvg)
  }

  installCorePlugins(app, options)
  registerGlobalComponents(app, options)

  const context = { app }
  void options.setup?.(context)

  return {
    app,
    use: app.use.bind(app),
    mount: app.mount.bind(app),
  }
}
