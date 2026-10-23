import type { SchemaFormModel } from '@lumal/core/components'
import type { BusinessTransport } from '../../../app/services/contracts'
import type { Organization, OrganizationInput } from './types'
import { formStatus, integer, object, rows, text } from '../../../shared/api'

export function organizationInput(model: SchemaFormModel): OrganizationInput {
  return { name: text(model.name, '机构名称', true), code: text(model.code, '机构编码', true), parentId: text(model.parentId, '父机构'), leader: text(model.leader, '负责人'), phone: text(model.phone, '联系电话'), email: text(model.email, '邮箱'), order: integer(model.order ?? 0), status: formStatus(model) }
}
export function parseOrganization(value: unknown): Organization {
  const raw = object(value)
  return { ...organizationInput(raw), id: text(raw.id, '机构 ID', true), children: raw.children === undefined ? undefined : rows(raw.children, parseOrganization), userCount: typeof raw.userCount === 'number' ? raw.userCount : undefined }
}
export function createOrganizationService(transport: BusinessTransport) {
  return {
    list: async () => rows(await transport.request('GET', '/system/organizations'), parseOrganization),
    create: async (input: OrganizationInput) => parseOrganization(await transport.request('POST', '/system/organizations', { body: input })),
    update: async (id: string, input: OrganizationInput) => parseOrganization(await transport.request('PUT', `/system/organizations/${encodeURIComponent(id)}`, { body: input })),
    remove: (id: string) => transport.request<void>('DELETE', `/system/organizations/${encodeURIComponent(id)}`),
  }
}
