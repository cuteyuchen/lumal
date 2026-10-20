import { createPermissionStore, permissionStoreKey } from '@lumal/core/permission'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, shallowRef, withDirectives } from 'vue'
import { AccessControl, adaptVbenMenus, adaptVbenRouteMeta, createVbenAccessDirective, useAccess } from '../src/v5'

describe('vben 5 权限和路由', () => {
  it('authority 只映射角色，不意外要求同名权限', () => {
    expect(adaptVbenRouteMeta({ title: '用户', authority: ['admin', 'super'], affixTab: true, keepAlive: true, activePath: '/users', hideInMenu: true }))
      .toMatchObject({ title: '用户', roles: ['admin', 'super'], affixTab: true, keepAlive: true, activeMenu: '/users', hideInMenu: true })
    expect(adaptVbenRouteMeta({ authority: ['admin'], ignoreAccess: true }).roles).toEqual([])
    expect(adaptVbenRouteMeta({ authority: ['admin'] }).authority).toBeUndefined()
    const menus = adaptVbenMenus([{ path: '/users', name: 'Users', component: 'system/users', redirect: '/users/list', children: [{ path: '/users/list', meta: { hideInTab: true } }] }])
    expect(menus[0]?.children?.[0]?.meta?.hideInTab).toBe(true)
  })
  it('外链拒绝可执行协议，iframe 需要应用显式白名单组件', () => {
    expect(adaptVbenRouteMeta({ link: 'https://example.com' }).externalLink).toBe('https://example.com')
    expect(() => adaptVbenRouteMeta({ link: 'javascript:alert(1)' })).toThrow('HTTP(S)')
    expect(() => adaptVbenMenus([{ path: '/frame', meta: { iframeSrc: 'https://example.com' } }])).toThrow('iframeComponent')
    expect(adaptVbenMenus([{ path: '/frame', meta: { iframeSrc: 'https://example.com' } }], { iframeComponent: 'app/iframe' })[0]?.component).toBe('app/iframe')
  })
  it('权限和角色分别采用 some，空数组不授权', () => {
    const store = createPermissionStore({ roles: ['admin'], permissions: ['write'] })
    const access = useAccess(store)
    expect(access.hasAccessByCodes(['read', 'write'])).toBe(true)
    expect(access.hasAccessByRoles(['super', 'admin'])).toBe(true)
    expect(access.hasAccessByCodes([])).toBe(false)
    expect(access.hasAccessByRoles(['write'])).toBe(false)
  })
  it('权限组件和指令响应账号权限变化，卸载清理 effect', async () => {
    const store = createPermissionStore({ roles: ['admin'], permissions: ['write'] })
    const codes = shallowRef(['write'])
    const directive = createVbenAccessDirective(store)
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [
        h(AccessControl, { type: 'role', codes: ['admin'] }, () => h('span', '角色按钮')),
        withDirectives(h('button', { 'data-action': 'write' }, '写入'), [[directive, codes.value, 'code']]),
      ]),
    }), { global: { provide: { [permissionStoreKey as symbol]: store } } })
    expect(wrapper.text()).toContain('角色按钮')
    store.clear()
    await nextTick()
    expect(wrapper.text()).not.toContain('角色按钮')
    expect(wrapper.get('button').attributes('style')).toContain('display: none')
    codes.value = ['new']
    store.setPermissions(['new'])
    await nextTick()
    expect(wrapper.get('button').attributes('style') ?? '').not.toContain('none')
    wrapper.unmount()
    store.clear()
  })
})
