import type { BusinessRequest, CurrentUser, DataRow, HttpMethod } from './contracts'

export interface LocalDatabase {
  read: <T extends DataRow = DataRow>(resource: string, initial?: () => T[]) => T[]
  write: <T extends DataRow>(resource: string, rows: T[]) => void
}
export interface LocalBusinessContext {
  db: LocalDatabase
  user: () => CurrentUser
  assertPermission: (code: string) => void
}
export interface LocalHandler {
  handles: (path: string) => boolean
  request: (method: HttpMethod, path: string, input: BusinessRequest) => Promise<unknown>
}
export interface LocalModule {
  createLocalHandler: (context: LocalBusinessContext) => LocalHandler
}
