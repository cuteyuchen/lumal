import type { Status } from '../../../shared/api'

export interface OrganizationInput { name: string, code: string, parentId: string, leader: string, phone: string, email: string, order: number, status: Status }
export interface Organization extends OrganizationInput { id: string, children?: Organization[], userCount?: number }
