import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: [
      '**/*.md',
      '**/dist/**',
      '**/node_modules/**',
    ],
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
      'style/spaced-comment': 'off',
    },
  },
  {
    files: [
      'apps/lumal-datav-guide/src/pages/components/**/*.vue',
    ],
    rules: {
      // Vue's template parser mistakes TypeScript union assertions for legacy filters.
      'vue/no-deprecated-filter': 'off',
    },
  },
  {
    files: [
      'apps/lumal-docs/src/.vitepress/**/*.ts',
      'apps/lumal-mock-api/**/*.ts',
    ],
    rules: {
      // These files are native ESM and intentionally use Node's global process object.
      'node/prefer-global/process': 'off',
    },
  },
)
