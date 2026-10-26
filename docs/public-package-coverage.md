# 十包文档与示例覆盖

版本基准：`0.0.6-beta`；工作分支包含未发布的 Cockpit Designer 名称补丁。
本表是维护清单，不表示每个导出都经过浏览器测试或所有示例已部署。

| 公共包 | 公开能力组 | 文档入口 | 可运行证据 / 示例 |
| --- | --- | --- | --- |
| `@lumal/core` | 启动、布局、路由、权限、请求、主题、字典、Schema / CRUD | [Core](/packages/core)、[Core API](/reference/core-api) | Admin 原有页面、单元和生产 E2E；真实 API 字段留在 Adapter |
| `@lumal/charts` | Chart / ChartPanel、数据状态与导出 | [Charts](/packages/charts) | Admin chart / chart-panel，Cockpit 趋势图 |
| `@lumal/viewport` | 组件、plugin、policy、尺寸、比例、字号工具 | [Viewport](/packages/viewport)、[适配](/reference/screen-viewport-guide) | Admin Viewport、Cockpit lab、viewport-lab 隔离消费者 |
| `@lumal/datav` | 边框、装饰、数字、滚动、图表适配、全屏容器 | [DataV](/packages/datav)、[示例](/reference/datav-examples) | DataV Guide、Admin DataV 页、视觉回归 |
| `@lumal/cockpit` | Runtime、registry、消息、配置、Designer | [Cockpit](/packages/cockpit)、[Runtime](/components/cockpit/runtime)、[Designer](/components/cockpit/designer) | 独立 Demo 四中心、Admin 轻量嵌入、Designer 单元和生产 E2E |
| `@lumal/icons` | 注册、SVG、URI、可选 morph | [Icons](/packages/icons) | Admin 图标页；动画独立入口，静态内核边界测试 |
| `@lumal/icons-vue` | 图标组件、选择器、响应式注册 | [Icons Vue](/packages/icons-vue) | Admin 图标页、应用真实图标按钮 |
| `@lumal/vite` | Resolver、workspace aliases、Devtools、定向 viewport 转换 | [Vite](/packages/vite) | 构建配置、插件消费者与 CSS 转换测试，不伪装运行时组件 |
| `@lumal/vben-compat` | `/v5` 与 `/legacy` 适配 | [兼容层](/packages/vben-compat) | vben-compat-demo、独立消费者；不是 Vben 全量兼容 |
| `create-lumal-admin` | Admin / Screen / Blank、通用 bin、工程质量 | [脚手架](/packages/create-lumal-admin)、[模板](/reference/project-template-guide) | 模板消费者、CLI PTY / 取消回滚；不存在独立 create-lumal npm 包 |

## 新 API 的检查规则

1. 同步 `package.json.exports`、类型、包 README、站点包页与 Skill 对应 reference。
2. 新运行时能力提供最小可运行代码；Vite/CLI 则提供真实命令及产物测试。
3. 检查 peers / 样式、组合边界、错误状态和版本说明，不复制业务源码。
4. 更新本表，注明测试文件和未执行的验证，不用文档覆盖率替代行为验收。
5. `pnpm docs:build` 开启死链接检查；`pnpm test:scripts` 检查十包入口与文档覆盖契约。
6. 新 Demo 懒加载，原消费者预算不变；上线后另核对域名对应 Deployment。
