import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  compatibilityDate: '2026-07-12',
  preset: 'vercel',
  routeRules: {
    '/api/**': {
      cors: true,
    },
  },
})
