# GitHub Pages 部署

2026-10-10；0.2.0 预览。仓库：[nonspt/Rowing](https://github.com/nonspt/Rowing)，在线应用：[划船机](https://nonspt.github.io/Rowing/)。

Pages 已在此前由用户开启，Source 为 GitHub Actions；本轮无需重复设置。main 更新自动测试、构建、发布。

## 构建与路径

工作流使用 Ubuntu 24.04、Node 24、pnpm 11.25.0，第三方 Action 固定提交；依次执行锁文件安装、21 项规则、SVG 审计、生产构建、/Rowing/ 子路径与 iPhone Air 完整操作 / 布局、上传 dist 与 Pages 发布。构建 contents:read，部署 pages:write / id-token:write。

仅提交源码、锁文件、安装资源、脚本、测试与维护文档；不上传 node_modules、dist、test-results、.env 或用户备份。

Vite base=./；Hash 页面 #/plans；Manifest id / scope=./，start_url=./#/plans。SW 注册基于 document.baseURI，缓存限注册范围。旧 Hash 自动归一至计划页。

Pages 不读取 _headers；构建 HTML 在脚本之前设置 CSP 与 no-referrer。HTTP 专用策略受宿主能力限制。

## 发布验收

pnpm test:pages 挂载无自定义 HTTP 安全头的 /Rowing/，检查路径、图标、SW、CSP、离线与 iPhone Air 9+13 组流程。线上通过 APP_URL 指向 HTTPS 后独立核验界面、模板 / 自定义、跟练、存储、备份、深色及离线。

报告在忽略的 test-results，测试使用隔离浏览器与合成数据。真实 iOS Safari / 主屏仍需实际设备。

## 更新与数据保护

旧 app 有未完成草稿时阻止 waiting worker 激活。结束或保留备份、处理草稿后，在设置更新版本；接管后才重载，不强制跳过未保存训练。

数据库 1→2 无损升级七个 store。旧记录、计划、学习、草稿保留；导出 v2，导入 v1 / v2。不同源 / 浏览器不自动转移，迁移需导出 → 校验 → 预览 → 确认合并 → 核验。

## 回滚

不能直接把 0.1.x 部署到已有 v2 数据的源。修复应采用保持 v2 数据兼容的 0.2.x 补丁，或只回退受影响 UI，同时保留 v2 Repository / 校验和新 Plan 定义。通过 main 新增提交重走 CI，不强推或删库恢复。

v2 备份只能导入仍支持 v2 的已验证构建。完整回滚演练未执行，见 KNOWN_ISSUES 与 [ADR 0003](../architecture/ADR/0003-focused-plans-v2.md)。

依据：[GitHub 自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
