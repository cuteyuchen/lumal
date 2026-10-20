import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  ignores: ['dist/**', 'coverage/**'],
  // 与 Lumal 仓库一致，保留 Composition API 功能分块注释。
  rules: { 'style/spaced-comment': 'off' },
})
