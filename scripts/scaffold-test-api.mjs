import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const groups = [
  ['user', '用户管理', ['list', 'create', 'update', 'delete', 'status', 'assign-roles', 'reset-password']],
  ['role', '角色管理', ['list', 'create', 'update', 'delete', 'authorize']],
  ['menu', '菜单管理', ['list', 'create', 'update', 'delete']],
  ['organization', '机构管理', ['list', 'create', 'update', 'delete']],
  ['dict', '字典管理', ['list', 'create', 'update', 'delete']],
  ['config', '系统配置', ['view', 'update']],
]
const permissionTree = groups.map(([code, label, actions]) => ({
  id: code,
  label,
  children: actions.map(action => ({ id: `system:${code}:${action}`, label: action, permission: `system:${code}:${action}` })),
}))
const permissions = permissionTree.flatMap(node => node.children.map(child => child.permission))
const defaultConfig = { appName: 'Lumal Admin', colorPrimary: '#1677ff', layout: 'mixed-nav', tabbarEnable: true, transitionEnable: true }
function navigation(preset) {
  const menus = [{ path: '/dashboard', name: 'Dashboard', component: 'dashboard/index', meta: { title: '工作台', affixTab: true, keepAlive: true, roles: ['admin', 'guest'] } }]
  if (preset !== 'minimal') {
    const definitions = [['users', 'user', '用户管理'], ['roles', 'role', '角色管理'], ['menus', 'menu', '菜单管理'], ['organizations', 'organization', '机构管理'], ['dictionaries/types', 'dict', '字典分类'], ['dictionaries/items', 'dict', '字典项管理'], ['config', 'config', '系统配置']]
    menus.push({ path: '/system', name: 'System', meta: { title: '系统管理', order: 10 }, children: definitions.map(([resource, code, title], index) => ({
      path: `/system/${resource}`,
      name: `System-${resource.replaceAll('/', '-')}`,
      component: `system/${resource}`,
      meta: { title, authority: [`system:${code}:${code === 'config' ? 'view' : 'list'}`], keepAlive: true, order: index },
    })) })
    menus.push({ path: '/examples', name: 'Examples', meta: { title: '开发示例', order: 20 }, children: [
      { path: '/examples/form', name: 'FormExample', component: 'examples/form', meta: { title: 'Schema 表单', keepAlive: true } },
      { path: '/examples/crud', name: 'CrudExample', component: 'examples/crud', meta: { title: 'CRUD 示例', keepAlive: true } },
    ] })
    menus.push({ path: '/profile', name: 'Profile', component: 'profile/index', meta: { title: '个人中心', hideInMenu: true } })
  }
  if (preset === 'vben-compatible') {
    menus.push({ path: '/migration', name: 'Migration', meta: { title: 'Vben 迁移示例', order: 30 }, children: [
      { path: '/migration/form', name: 'VbenForm', component: 'migration/form', meta: { title: 'Vben 表单迁移', keepAlive: true } },
      { path: '/migration/users', name: 'VbenUsers', component: 'migration/users', meta: { title: 'Vben 业务迁移', roles: ['admin'], keepAlive: true } },
    ] })
  }
  return menus
}
function menuRows(menus, parentId = '') {
  return menus.flatMap(menu => [{
    id: menu.name,
    parentId,
    title: menu.meta.title,
    name: menu.name,
    path: menu.path,
    type: menu.component ? 'menu' : 'directory',
    component: menu.component ?? '',
    icon: '',
    order: menu.meta.order ?? 0,
    hidden: menu.meta.hideInMenu === true,
    permissions: menu.meta.authority ?? [],
    roles: menu.meta.roles ?? [],
    externalLink: '',
    affixTab: menu.meta.affixTab === true,
    keepAlive: menu.meta.keepAlive === true,
  }, ...menuRows(menu.children ?? [], menu.name)])
}
function tree(rows, parentId = '') {
  return rows.filter(row => row.parentId === parentId).map(row => ({ ...row, children: tree(rows, row.id) }))
}

/** 独立 HTTP 验收后端。真实网络、身份鉴权、专用端点，不拦截浏览器 fetch。 */
export async function createScaffoldTestApi() {
  const sessions = new Map()
  const refreshes = new Map()
  const databases = new Map()
  const state = { failList: false, failAuthorization: false, failAccess: false, failConfigSave: false, requests: 0, refreshes: 0, profileWrites: 0 }
  function database(preset) {
    if (!databases.has(preset)) {
      databases.set(preset, {
        'users': ['admin', 'guest'].map(username => ({ id: username, username, nickname: username === 'admin' ? '管理员' : '访客', organizationId: 'root', roles: [username], status: 'enabled', phone: '', createdAt: '', password: 'integration-pass' })),
        'roles': ['admin', 'guest'].map(code => ({ id: code, code, name: code === 'admin' ? '管理员' : '访客', status: 'enabled', builtIn: true, description: '', permissions: code === 'admin' ? [...permissions] : [] })),
        'menus': menuRows(navigation(preset)),
        'organizations': [{ id: 'root', parentId: '', name: '总部', code: 'root', leader: '管理员', phone: '', email: '', status: 'enabled', order: 0 }],
        'dictionaries/types': [{ id: 'status', name: '状态', code: 'status', description: '', status: 'enabled' }],
        'dictionaries/items': [{ id: 'enabled', typeCode: 'status', label: '启用', value: 'enabled', color: '#15803d', status: 'enabled', order: 0 }],
        'config': { ...defaultConfig },
      })
    }
    return databases.get(preset)
  }
  const cleanUser = ({ password: _password, ...user }) => user
  const server = createServer(async (request, response) => {
    const send = (value, status = 200) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(value ?? null))
    }
    try {
      state.requests += 1
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      if (request.method === 'OPTIONS')
        return send(null, 204)
      const url = new URL(request.url, 'http://localhost')
      const [, preset, ...parts] = url.pathname.split('/')
      const path = `/${parts.join('/')}`
      const method = request.method
      const db = database(preset)
      let raw = ''
      for await (const chunk of request) raw += String(chunk)
      const input = raw ? JSON.parse(raw) : {}
      function issue(username) {
        const accessToken = randomUUID()
        const refreshToken = randomUUID()
        sessions.set(accessToken, username)
        refreshes.set(refreshToken, username)
        return { accessToken, refreshToken }
      }
      if (path === '/auth/login') {
        const user = db.users.find(row => row.username === input.username && row.status === 'enabled' && row.password === input.password)
        return user ? send(issue(user.username)) : send({ message: '账号或密码错误' }, 401)
      }
      if (path === '/auth/refresh') {
        state.refreshes += 1
        const username = refreshes.get(input.refreshToken)
        return username ? send(issue(username)) : send({ message: '刷新失败' }, 401)
      }
      const token = request.headers.authorization?.replace('Bearer ', '')
      const username = sessions.get(token)
      const current = db.users.find(row => row.username === username && row.status === 'enabled')
      if (!current)
        return send({ message: '会话已过期' }, 401)
      const roles = db.roles.filter(role => current.roles.includes(role.code) && role.status === 'enabled')
      const access = { roles: roles.map(role => role.code), permissions: [...new Set(roles.flatMap(role => role.permissions))] }
      function requirePermission(permission) {
        if (!access.permissions.includes(permission))
          throw Object.assign(new Error(`无操作权限：${permission}`), { status: 403 })
      }
      if (path === '/auth/logout') {
        sessions.delete(token)
        return send({})
      }
      if (path === '/session/me')
        return send({ id: current.id, name: current.nickname, username })
      if (path === '/session/access')
        return state.failAccess ? send({ message: '权限读取失败' }, 503) : send(access)
      if (path === '/menus') {
        const visit = parentId => db.menus.filter(row => row.parentId === parentId && row.type !== 'button').map(row => ({
          path: row.path,
          name: row.name,
          component: row.component || undefined,
          meta: { title: row.title, authority: row.permissions, roles: row.roles ?? [], hideInMenu: row.hidden, order: row.order, affixTab: row.affixTab, keepAlive: row.keepAlive },
          children: visit(row.id),
        }))
        return send(visit(''))
      }
      if (path === '/profile/password' && method === 'PUT') {
        if (current.password !== input.currentPassword || typeof input.newPassword !== 'string' || input.newPassword.length < 8)
          throw new Error('当前密码错误或新密码过短')
        current.password = input.newPassword
        return send({})
      }
      if (path === '/profile') {
        if (method === 'PUT') {
          if (!input.nickname || input.nickname.length > 32)
            throw new Error('昵称无效')
          Object.assign(current, { nickname: input.nickname, phone: input.phone })
          state.profileWrites += 1
        }
        return send(cleanUser(current))
      }
      if (state.failList && method === 'GET')
        return send({ message: '测试网络失败' }, 503)
      if (path === '/system/roles/options') {
        requirePermission('system:user:list')
        return send(db.roles.map(role => ({ label: role.name, value: role.code, disabled: role.status !== 'enabled' })))
      }
      if (path === '/system/organizations/options') {
        requirePermission('system:user:list')
        const options = rows => rows.map(row => ({ label: row.name, value: row.id, children: options(row.children) }))
        return send(options(tree(db.organizations)))
      }
      if (path === '/system/permissions/tree') {
        requirePermission('system:role:authorize')
        return send(permissionTree)
      }
      const authorization = path.match(/^\/system\/roles\/([^/]+)\/permissions$/)
      if (authorization) {
        requirePermission('system:role:authorize')
        const role = db.roles.find(role => role.code === decodeURIComponent(authorization[1]))
        if (!role)
          throw new Error('角色不存在')
        if (method === 'PUT') {
          if (state.failAuthorization)
            return send({ message: '授权保存失败' }, 503)
          if (input.permissions.some(code => !permissions.includes(code)))
            throw new Error('包含未知权限')
          if (role.code === 'admin' && permissions.some(code => !input.permissions.includes(code)))
            throw new Error('不能移除管理员权限')
          role.permissions = [...input.permissions]
        }
        return send(role.permissions)
      }
      const batch = path.match(/^\/system\/users\/batch\/(status|roles)$/)
      const special = path.match(/^\/system\/users\/([^/]+)\/(status|roles|reset-password)$/)
      if (batch || special) {
        const action = batch?.[1] ?? special[2]
        requirePermission(`system:user:${action === 'roles' ? 'assign-roles' : action}`)
        const ids = batch ? input.ids : [decodeURIComponent(special[1])]
        const selected = ids.map(id => db.users.find(user => user.id === id))
        if (!selected.length || selected.some(row => !row))
          throw new Error('用户不存在')
        if (action === 'reset-password') {
          const temporaryPassword = randomUUID()
          selected.forEach((row) => {
            row.password = temporaryPassword
          })
          return send({ temporaryPassword })
        }
        if (selected.some(row => row.username === 'admin' && (action === 'status' ? input.status !== 'enabled' : !input.roles.includes('admin'))))
          throw new Error('不能移除内置管理员')
        selected.forEach((row) => {
          if (action === 'status')
            row.status = input.status
          else
            row.roles = batch && input.mode === 'append' ? [...new Set([...row.roles, ...input.roles])] : [...input.roles]
        })
        return send(batch ? { items: selected.map(cleanUser), updated: selected.length } : cleanUser(selected[0]))
      }
      if (path.startsWith('/system/dictionaries/options/')) {
        const code = decodeURIComponent(parts.at(-1))
        return send(db['dictionaries/items'].filter(row => row.typeCode === code && row.status === 'enabled').map(row => ({ label: row.label, value: row.value, color: row.color })))
      }
      if (path === '/system/config' || path === '/system/config/restore') {
        requirePermission(`system:config:${method === 'GET' ? 'view' : 'update'}`)
        if (method !== 'GET') {
          if (state.failConfigSave)
            return send({ message: '配置保存失败' }, 503)
          const config = path.endsWith('/restore') ? defaultConfig : input
          if (!config.appName || !/^#[\da-f]{6}$/i.test(config.colorPrimary))
            throw new Error('配置无效')
          db.config = { ...config }
        }
        return send(db.config)
      }
      const match = path.match(/^\/system\/(users|roles|menus|organizations|dictionaries\/(?:types|items))(?:\/([^/]+))?$/)
      if (!match)
        return send({ message: '未实现的测试端点' }, 404)
      const resource = match[1]
      const id = match[2] ? decodeURIComponent(match[2]) : undefined
      const prefix = { 'users': 'user', 'roles': 'role', 'menus': 'menu', 'organizations': 'organization', 'dictionaries/types': 'dict', 'dictionaries/items': 'dict' }[resource]
      requirePermission(`system:${prefix}:${method === 'GET' ? 'list' : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update'}`)
      const rows = db[resource]
      if (method === 'GET') {
        let filtered = rows.filter(row => !url.searchParams.get('keyword') || Object.values(row).some(value => String(value).includes(url.searchParams.get('keyword'))))
        for (const key of ['status', 'typeCode', 'organizationId']) {
          if (url.searchParams.get(key))
            filtered = filtered.filter(row => row[key] === url.searchParams.get(key))
        }
        if (url.searchParams.get('roles'))
          filtered = filtered.filter(row => row.roles.includes(url.searchParams.get('roles')))
        if (resource === 'menus' || resource === 'organizations')
          return send(tree(filtered))
        if (resource.startsWith('dictionaries/'))
          return send(filtered)
        const page = Number(url.searchParams.get('page') ?? 1)
        const size = Number(url.searchParams.get('pageSize') ?? 10)
        return send({ items: filtered.slice((page - 1) * size, page * size).map(row => resource === 'users' ? cleanUser(row) : row), total: filtered.length })
      }
      const previous = rows.find(row => row.id === id)
      if (id && !previous)
        return send({ message: '记录不存在' }, 404)
      if (method === 'DELETE') {
        if (previous.builtIn || previous.username === 'admin')
          throw new Error('不能删除内置管理员或角色')
        if (rows.some(row => row.parentId === id))
          throw new Error('请先删除子节点')
        if (resource === 'roles' && db.users.some(user => user.roles.includes(previous.code)))
          throw new Error('角色仍被用户引用')
        if (resource === 'organizations' && db.users.some(user => user.organizationId === id))
          throw new Error('机构仍有关联用户')
        if (resource === 'dictionaries/types')
          db['dictionaries/items'] = db['dictionaries/items'].filter(row => row.typeCode !== previous.code)
        db[resource] = rows.filter(row => row.id !== id)
        return send({})
      }
      const row = { ...previous, ...input, id: id ?? randomUUID() }
      if (resource === 'users') {
        if (rows.some(item => item.id !== id && item.username === row.username))
          throw new Error('用户名重复')
        if (!row.nickname || row.roles.some(code => !db.roles.some(role => role.code === code)))
          throw new Error('资料或角色无效')
        row.password ??= 'integration-pass'
      }
      if (resource === 'roles') {
        if ('permissions' in input)
          throw new Error('角色授权必须单独保存')
        row.permissions ??= []
      }
      db[resource] = id ? rows.map(item => item.id === id ? row : item) : [...rows, row]
      return send(resource === 'users' ? cleanUser(row) : row)
    }
    catch (error) {
      send({ message: error.message }, error.status ?? 400)
    }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    state,
    reset(preset) {
      databases.delete(preset)
      sessions.clear()
      refreshes.clear()
      state.failList = false
      state.failAccess = false
      state.failAuthorization = false
      state.failConfigSave = false
      state.profileWrites = 0
    },
    seedUsers(preset) {
      const db = database(preset)
      db.users = db.users.filter(row => !row.id.startsWith('fixture-'))
      db.users.push(...Array.from({ length: 12 }, (_, index) => ({ id: `fixture-${index}`, username: `fixture-${index}`, nickname: '分页样例', organizationId: 'root', phone: '', createdAt: '', status: 'enabled', roles: ['guest'], password: 'integration-pass' })))
    },
    async close() {
      server.closeAllConnections()
      await new Promise((done, reject) => server.close(error => error ? reject(error) : done()))
    },
  }
}
