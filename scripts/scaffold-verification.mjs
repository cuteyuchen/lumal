import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'

async function listen(server) {
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return `http://127.0.0.1:${server.address().port}`
}
async function close(server) {
  server.closeAllConnections()
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()))
}

/** 独立消费者的真实网络后端，不替换 fetch；凭据与数据只存在于本轮验收进程。 */
export async function createScaffoldTestApi() {
  const sessions = new Map()
  const refreshes = new Map()
  const resources = new Map()
  const state = { failList: false, requests: 0, refreshes: 0 }
  const permissions = ['user', 'role', 'menu', 'organization', 'dict', 'config']
    .flatMap(resource => ['list', 'view', 'create', 'update', 'delete', 'authorize'].map(action => `system:${resource}:${action}`))
  const server = createServer(async (request, response) => {
    try {
      state.requests += 1
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      if (request.method === 'OPTIONS') {
        response.writeHead(204)
        response.end()
        return
      }
      const url = new URL(request.url, 'http://localhost')
      const [, preset, ...segments] = url.pathname.split('/')
      const path = `/${segments.join('/')}`
      let text = ''
      for await (const chunk of request) text += String(chunk)
      const input = text ? JSON.parse(text) : {}
      function send(data, status = 200) {
        response.writeHead(status, { 'content-type': 'application/json' })
        response.end(JSON.stringify(data))
      }
      function issue(username) {
        const accessToken = randomUUID()
        const refreshToken = randomUUID()
        sessions.set(accessToken, username)
        refreshes.set(refreshToken, username)
        return { accessToken, refreshToken }
      }
      if (path === '/auth/login') {
        if (!['admin', 'guest'].includes(input.username) || input.password !== 'integration-pass')
          return send({ message: '账号或密码不正确' }, 401)
        return send(issue(input.username))
      }
      if (path === '/auth/refresh') {
        state.refreshes += 1
        const username = refreshes.get(input.refreshToken)
        return username ? send(issue(username)) : send({}, 401)
      }
      const accessToken = request.headers.authorization?.replace('Bearer ', '')
      const username = sessions.get(accessToken)
      if (!username)
        return send({}, 401)
      if (path === '/auth/logout') {
        sessions.delete(accessToken)
        return send({})
      }
      if (path === '/session/me')
        return send({ id: username, name: username, username })
      if (path === '/session/access')
        return send({ roles: [username], permissions: username === 'admin' ? permissions : [] })
      if (path === '/menus') {
        // 任一角色可访问的固定页，验证标签与路由守卫的角色语义一致。
        const menus = [{ path: '/dashboard', name: 'Dashboard', component: 'dashboard/index', meta: { title: '工作台', affixTab: true, keepAlive: true, roles: ['admin', 'guest'] } }]
        if (preset !== 'minimal') {
          for (const [resource, code, title] of [['users', 'user', '用户管理'], ['roles', 'role', '角色管理'], ['menus', 'menu', '菜单管理'], ['organizations', 'organization', '机构管理'], ['dictionaries/types', 'dict', '字典管理'], ['dictionaries/items', 'dict', '字典项管理'], ['config', 'config', '系统配置']])
            menus.push({ path: `/system/${resource}`, name: `System-${resource.replaceAll('/', '-')}`, component: `system/${resource}`, meta: { title, authority: [`system:${code}:${code === 'config' ? 'view' : 'list'}`], keepAlive: true } })
          menus.push({ path: '/examples/form', name: 'FormExample', component: 'examples/form', meta: { title: 'Schema 表单' } })
          menus.push({ path: '/examples/crud', name: 'CrudExample', component: 'examples/crud', meta: { title: 'CRUD 示例' } })
        }
        if (preset === 'vben-compatible') {
          menus.push({ path: '/migration/form', name: 'VbenForm', component: 'migration/form', meta: { title: 'Vben 表单迁移' } })
          menus.push({ path: '/migration/users', name: 'VbenUsers', component: 'migration/users', meta: { title: 'Vben 业务迁移', roles: ['admin'] } })
        }
        return send(menus)
      }
      const resourceKey = segments.slice(1).join('/')
      const resource = segments[1] === 'dictionaries' ? segments.slice(1, 3).join('/') : segments[1]
      if (!resources.has(`${preset}:${resource}`))
        resources.set(`${preset}:${resource}`, resource === 'users' ? [{ id: '1', username: 'admin', nickname: '管理员', status: 'enabled', roles: ['admin'] }] : [])
      const rows = resources.get(`${preset}:${resource}`)
      if (request.method === 'GET' && path.startsWith('/system/')) {
        if (state.failList)
          return send({ message: '测试网络失败' }, 503)
        const keyword = url.searchParams.get('keyword') ?? ''
        const filtered = rows.filter(row => Object.values(row).some(value => String(value).includes(keyword)))
        const page = Number(url.searchParams.get('page') ?? 1)
        const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
        return send({ items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length })
      }
      if (request.method === 'POST' && path.startsWith('/system/')) {
        const record = { ...input, id: randomUUID() }
        rows.push(record)
        return send(record)
      }
      const id = resourceKey.slice(resource.length + 1)
      const index = rows.findIndex(row => row.id === id)
      if (index < 0)
        return send({}, 404)
      if (request.method === 'PUT') {
        rows[index] = { ...rows[index], ...input, id }
        return send(rows[index])
      }
      if (request.method === 'DELETE') {
        rows.splice(index, 1)
        return send({})
      }
      send({}, 404)
    }
    catch (error) {
      response.writeHead(500)
      response.end(String(error))
    }
  })
  return {
    url: await listen(server),
    state,
    seedUsers(preset) {
      const key = `${preset}:users`
      const rows = (resources.get(key) ?? []).filter(row => !String(row.id).startsWith('fixture-'))
      rows.push(...Array.from({ length: 12 }, (_, index) => ({ id: `fixture-${index}`, username: `fixture-${index}`, nickname: '分页样例', status: 'enabled', roles: ['guest'] })))
      resources.set(key, rows)
    },
    close: () => close(server),
  }
}

async function serveProduction(directory) {
  const root = resolve(directory, 'dist')
  const server = createServer(async (request, response) => {
    const path = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`)
    if (path !== root && !path.startsWith(`${root}${sep}`)) {
      response.writeHead(403)
      response.end()
      return
    }
    try {
      const file = path === root ? join(root, 'index.html') : path
      const data = await readFile(file)
      response.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[extname(file)] ?? 'application/octet-stream')
      response.end(data)
    }
    catch {
      if (extname(path)) {
        response.writeHead(404)
        response.end()
      }
      else {
        response.setHeader('content-type', 'text/html')
        response.end(await readFile(join(root, 'index.html')))
      }
    }
  })
  return { url: await listen(server), close: () => close(server) }
}

export async function verifyScaffoldBrowsers(projects, api, screenshotDirectory) {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined })
  const evidence = []
  try {
    for (const project of projects) {
      const preview = await serveProduction(project.projectDir)
      const context = await browser.newContext()
      const page = await context.newPage()
      const diagnostics = []
      page.on('pageerror', error => diagnostics.push(error.message))
      const path = route => `${preview.url}${project.routerMode === 'hash' ? '/#' : ''}${route}`
      const login = async (username = 'admin') => {
        await page.getByLabel('用户名', { exact: true }).fill(username)
        await page.getByLabel('密码', { exact: true }).fill(project.apiMode === 'local' ? 'lumal123' : 'integration-pass')
        await page.getByRole('button', { name: '登录', exact: true }).click()
      }
      try {
        const deep = project.preset === 'minimal' ? '/dashboard' : '/system/users'
        await page.goto(path(deep))
        await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
        await login()
        await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
        await expect(page).toHaveURL(new RegExp(`${deep.replaceAll('/', '\\/')}$`))
        await page.reload()
        await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
        if (project.preset === 'minimal')
          await expect(page.getByRole('tab', { name: '工作台', exact: true })).toHaveCount(0)
        await page.getByRole('button', { name: '切换深色模式', exact: true }).click()
        await expect(page.locator('html')).toHaveClass(/dark/)
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 10)')
        await page.getByRole('button', { name: '偏好设置', exact: true }).click()
        await expect(page.locator('.el-drawer')).toBeVisible()
        if (project.preset === 'minimal') {
          await page.locator('.el-drawer').getByRole('tab', { name: '布局', exact: true }).click()
          await page.locator('.lumal-theme-settings__row').filter({ hasText: '启用标签栏' }).locator('.el-switch').click()
        }
        await page.keyboard.press('Escape')
        await expect(page.locator('.el-drawer')).not.toBeVisible()
        await expect(page.locator('.lumal-tabs__item.is-pinned').filter({ hasText: '工作台' })).toBeVisible()
        if (project.preset !== 'minimal') {
          await page.goto(path('/examples/form'))
          await expect(page.locator('.el-alert--error')).toHaveCount(0)
          await page.getByRole('button', { name: '提交', exact: true }).click()
          await expect(page.locator('.el-form-item__error')).toBeVisible()
          await page.locator('input[name="name"]').fill('标准表单验证')
          await page.locator('[data-field="notify"] .el-switch').click()
          await page.locator('input[name="email"]').fill('test@example.com')
          await page.getByRole('button', { name: '提交', exact: true }).click()
          await expect(page.locator('.el-message--success')).toContainText('保存成功')
          // 通过菜单切页再返回，验证标签与 KeepAlive 保留表单值。
          await page.getByRole('menuitem', { name: '用户管理', exact: true }).click()
          await page.getByRole('menuitem', { name: 'Schema 表单', exact: true }).click()
          await expect(page.locator('.el-alert--error')).toHaveCount(0)
          await expect(page.locator('input[name="name"]')).toHaveValue('标准表单验证')
          await page.goto(path('/system/users'))
          await page.getByRole('button', { name: '新增', exact: true }).click()
          const dialog = page.getByRole('dialog')
          await dialog.locator('input[name="username"]').fill('standard-test')
          await dialog.locator('input[name="nickname"]').fill('标准用户')
          await dialog.getByRole('button', { name: '保存', exact: true }).click()
          await expect(dialog).not.toBeVisible()
          await page.locator('input[name="keyword"]').fill('standard-test')
          await page.getByRole('button', { name: '查询', exact: true }).click()
          const row = page.locator('.el-table__row').filter({ hasText: 'standard-test' })
          await expect(row).toBeVisible()
          await row.getByRole('button', { name: '编辑', exact: true }).click()
          await dialog.locator('input[name="nickname"]').fill('标准用户已编辑')
          await dialog.getByRole('button', { name: '保存', exact: true }).click()
          await expect(row).toContainText('标准用户已编辑')
          await row.getByRole('button', { name: '删除', exact: true }).click()
          await page.locator('.el-message-box').getByRole('button', { name: '删除', exact: true }).click()
          await expect(row).toHaveCount(0)
          await expect(page.locator('.el-message-box')).not.toBeVisible()
        }
        if (project.preset === 'vben-compatible') {
          await page.goto(path('/migration/form'))
          await page.getByRole('button', { name: '提交', exact: true }).click()
          await expect(page.locator('.el-form-item__error').first()).toBeVisible()
          await page.locator('input[name="name"]').fill('迁移验证')
          await page.locator('[data-field="role"] .el-select').click()
          await page.getByRole('option', { name: '管理员', exact: true }).click()
          await page.locator('[data-field="date"] input').fill('2026-10-20')
          await page.locator('[data-field="date"] input').press('Tab')
          await page.locator('input[name="remark"]').fill('verified')
          await page.getByRole('button', { name: '提交', exact: true }).click()
          await expect(page.getByLabel('提交结果')).toContainText('迁移验证')
          await page.locator('[data-field="enabled"] .el-switch').click()
          await expect(page.locator('[data-field="remark"]')).toHaveCount(0)
          if (project.apiMode === 'http') {
            api.seedUsers(project.preset)
          }
          else {
            // 仅准备本地演示数据；后续分页、查询和 CRUD 均经过真实应用服务。
            await page.evaluate(() => {
              const key = 'demo:system:users'
              const rows = JSON.parse(localStorage.getItem(key) ?? '[]')
              rows.push(...Array.from({ length: 12 }, (_, index) => ({ id: `fixture-${index}`, username: `fixture-${index}`, nickname: '分页样例', status: 'enabled', roles: ['guest'] })))
              localStorage.setItem(key, JSON.stringify(rows))
            })
          }
          await page.goto(path('/migration/users'))
          await expect(page.locator('.el-table__row')).toHaveCount(10)
          await page.locator('.btn-next').click()
          await expect(page.locator('.el-pagination .number.is-active')).toHaveText('2')
          await expect(page.locator('.el-table__row').first()).toContainText('fixture-')
          await page.getByRole('button', { name: '刷新', exact: true }).last().click()
          await expect(page.locator('.el-pagination .number.is-active')).toHaveText('2')
          await page.locator('input[name="keyword"]').fill('no-match')
          await page.getByRole('button', { name: '查询', exact: true }).click()
          await expect(page.locator('.el-table__row')).toHaveCount(0)
          await page.getByRole('button', { name: '重置', exact: true }).click()
          await expect(page.locator('.el-table__row').first()).toBeVisible()
          const settings = page.getByLabel('列设置', { exact: true })
          await settings.click()
          const nicknameColumn = page.locator('.lumal-schema-table__column-options .el-checkbox').filter({ hasText: '昵称' })
          await nicknameColumn.click()
          await expect(page.getByRole('columnheader', { name: '昵称', exact: true })).toHaveCount(0)
          await nicknameColumn.click()
          await expect(page.getByRole('columnheader', { name: '昵称', exact: true })).toHaveCount(1)
          await settings.click()
          await page.locator('input[name="keyword"]').fill('migration-test')
          await page.getByRole('button', { name: '查询', exact: true }).click()
          await expect(page.locator('.el-table__row')).toHaveCount(0)
          await page.getByRole('button', { name: '新增用户', exact: true }).click()
          const dialog = page.getByRole('dialog')
          await dialog.locator('input[name="username"]').fill('migration-test')
          await dialog.locator('input[name="nickname"]').fill('迁移测试用户')
          await dialog.getByRole('button', { name: '保存', exact: true }).click()
          await expect(dialog).not.toBeVisible()
          const row = page.locator('.el-table__row').filter({ hasText: 'migration-test' })
          await expect(row).toBeVisible()
          await row.getByRole('button', { name: '编辑', exact: true }).click()
          await dialog.locator('input[name="nickname"]').fill('已编辑')
          await dialog.getByRole('button', { name: '保存', exact: true }).click()
          await expect(row).toContainText('已编辑')
          await row.getByRole('button', { name: '删除', exact: true }).click()
          await page.locator('.el-message-box').getByRole('button', { name: /确定|确认/ }).click()
          await expect(row).toHaveCount(0)
          await expect(page.locator('.el-message-box')).not.toBeVisible()
          if (project.apiMode === 'http') {
            api.state.failList = true
            await page.getByRole('button', { name: '刷新', exact: true }).last().click()
            await expect(page.locator('.lumal-v5-grid__error')).toBeVisible()
            api.state.failList = false
            await page.getByRole('button', { name: '重试', exact: true }).click()
            await expect(page.locator('.lumal-v5-grid__error')).toHaveCount(0)
          }
        }
        await page.screenshot({ path: join(screenshotDirectory, `desktop-${project.preset}-${project.apiMode}-${project.routerMode}.png`), fullPage: true })
        await page.setViewportSize({ width: 390, height: 844 })
        await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
        expect(overflow).toBe(false)
        await page.screenshot({ path: join(screenshotDirectory, `${project.preset}-${project.apiMode}-${project.routerMode}.png`), fullPage: true })
        await page.getByRole('button', { name: '退出登录', exact: true }).click()
        await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
        await login('guest')
        await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible()
        if (project.preset !== 'minimal') {
          await page.goto(path('/system/users'))
          await expect(page).toHaveURL(/\/403$/)
        }
        if (project.preset === 'vben-compatible') {
          await page.goto(path('/migration/users'))
          await expect(page).toHaveURL(/\/403$/)
          expect(await page.getByRole('button', { name: '新增用户', exact: true }).count()).toBe(0)
        }
        expect(diagnostics).toEqual([])
        evidence.push({ preset: project.preset, apiMode: project.apiMode, routerMode: project.routerMode, chromium: browser.version(), status: 'passed' })
      }
      catch (error) {
        await page.screenshot({ path: join(screenshotDirectory, `failed-${project.preset}-${project.apiMode}-${project.routerMode}.png`), fullPage: true })
        throw error
      }
      finally {
        api.state.failList = false
        await context.close()
        await preview.close()
      }
    }
  }
  finally {
    await browser.close()
  }
  return evidence
}
