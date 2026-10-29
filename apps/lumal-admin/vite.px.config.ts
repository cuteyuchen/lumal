import { defineConfig } from 'vite'
import { createAdminViteConfig } from './vite.config'

export default defineConfig(env => createAdminViteConfig(env, false))
