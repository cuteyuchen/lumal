import type { AdminSystemConfig } from './preferences'
import {
  getAdminSystemConfig,
  resetAdminSystemConfig,
  updateAdminSystemConfig,
} from './preferences'

export async function fetchAdminSystemConfig(): Promise<AdminSystemConfig> {
  return getAdminSystemConfig()
}

export async function saveAdminSystemConfig(config: AdminSystemConfig): Promise<AdminSystemConfig> {
  const previous = getAdminSystemConfig()

  try {
    return updateAdminSystemConfig(config)
  }
  catch (error) {
    updateAdminSystemConfig(previous)
    throw error
  }
}

export async function restoreAdminSystemConfig(): Promise<AdminSystemConfig> {
  resetAdminSystemConfig()
  return getAdminSystemConfig()
}
