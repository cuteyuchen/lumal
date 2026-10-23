import type { Query, Status } from '../../../shared/api'

export interface User {
  id: string
  username: string
  nickname: string
  organizationId: string
  roles: string[]
  phone: string
  status: Status
  createdAt: string
}
export interface UserInput { username: string, nickname: string, organizationId: string, roles: string[], phone: string, status: Status }
export interface UserQuery extends Query { organizationId?: string, roles?: string }
export interface UserBatchResult { items: User[], updated: number }
