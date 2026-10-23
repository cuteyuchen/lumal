import type { DataRow } from '../../app/services/contracts'
import type { LocalBusinessContext, LocalHandler } from '../../app/services/local-contracts'
import { object } from '../../app/menu-policy'
import { profileInput } from './api'

export function createLocalHandler({ db, user }: LocalBusinessContext): LocalHandler {
  return {
    handles: path => path === '/profile' || path === '/profile/password',
    async request(method, path, input) {
      const current = db.read('users').find(row => row.id === user().id)
      if (!current)
        throw new Error('当前用户不存在')
      const clean = ({ password: _password, ...profile }: DataRow) => profile
      if (path === '/profile' && method === 'GET')
        return clean(current)
      if (path === '/profile' && method === 'PUT') {
        const next = { ...current, ...profileInput(object(input.body)) }
        db.write('users', db.read('users').map(row => row.id === current.id ? next : row))
        return clean(next)
      }
      if (path === '/profile/password' && method === 'PUT') {
        const body = object(input.body)
        if (body.currentPassword !== current.password || typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 32)
          throw new Error('当前密码错误或新密码长度不符合要求')
        db.write('users', db.read('users').map(row => row.id === current.id ? { ...row, password: body.newPassword } : row))
        return
      }
      throw new Error('不支持的个人资料操作')
    },
  }
}
