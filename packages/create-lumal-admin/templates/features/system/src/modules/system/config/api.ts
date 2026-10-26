import type { SchemaFormModel } from '@lumal/core/components';
import type { BusinessTransport } from '../../../app/services/contracts';
import { object, text } from '../../../shared/api';

export interface SystemConfig {
  appName: string;
  colorPrimary: string;
  layout: 'sidebar-nav' | 'top-nav' | 'mixed-nav';
  tabbarEnable: boolean;
  transitionEnable: boolean;
}
export function configInput(model: SchemaFormModel): SystemConfig {
  const appName = text(model.appName, '应用名称', true);
  const colorPrimary = text(model.colorPrimary, '主题色', true);
  if (
    appName.length > 64 ||
    !/^#[\da-f]{6}$/i.test(colorPrimary) ||
    !['sidebar-nav', 'top-nav', 'mixed-nav'].includes(String(model.layout))
  )
    throw new Error('应用名称、主题色或导航布局无效');
  if (typeof model.tabbarEnable !== 'boolean' || typeof model.transitionEnable !== 'boolean')
    throw new Error('标签栏和动画设置必须是布尔值');
  return {
    appName,
    colorPrimary,
    layout: model.layout as SystemConfig['layout'],
    tabbarEnable: model.tabbarEnable,
    transitionEnable: model.transitionEnable,
  };
}
export function createConfigService(transport: BusinessTransport) {
  return {
    get: async () => configInput(object(await transport.request('GET', '/system/config'))),
    save: async (input: SystemConfig) =>
      configInput(object(await transport.request('PUT', '/system/config', { body: input }))),
    restore: async () => configInput(object(await transport.request('POST', '/system/config/restore'))),
  };
}
