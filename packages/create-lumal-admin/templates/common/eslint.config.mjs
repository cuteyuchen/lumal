import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import antfu from '@antfu/eslint-config';
import prettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';

const root = fileURLToPath(new URL('.', import.meta.url));
const hybrid =
  existsSync(new URL('./src/admin', import.meta.url)) && existsSync(new URL('./src/screen', import.meta.url));

export default antfu(
  {
    vue: true,
    typescript: true,
    // Prettier 独占格式化；不启用 Antfu 的格式插件。
    stylistic: false,
    formatters: false,
    ignores: ['**/dist/**', '**/coverage/**', '**/*.d.ts', 'pnpm-lock.yaml', '**/*.md'],
    rules: {
      'antfu/if-newline': 'off',
      'antfu/curly': 'off',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: true }],
      'vue/component-api-style': ['error', ['script-setup']],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'node/prefer-global/process': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: fileURLToPath(new URL('./tsconfig.json', import.meta.url)) }),
      ],
    },
    rules: {
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: root,
          zones: [
            { target: './src/shared', from: './src/modules', message: '共享层不得反向依赖业务模块。' },
            ...(hybrid
              ? [
                  { target: './src/screen', from: './src/admin' },
                  { target: './src/admin', from: './src/screen' },
                  { target: './src/shared', from: ['./src/admin', './src/screen'] },
                ]
              : []),
          ],
        },
      ],
    },
  },
  prettier,
);
