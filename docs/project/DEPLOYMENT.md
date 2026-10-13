# GitHub Pages 部署

2026-10-13；用户确认本轮紧凑控件 / 日程改动并授权上传，目标 **1.2.0 正式版**。正式构建 **c676b5417daf** 的生产构建 / 43 项规则 / SVG / 许可 / 生产依赖审计、/Rowing/ 紧凑控件 5 组及 PWA 5 组通过，云端与线上验收进行中。已确认本地 UI 基线 43e36a14c3c6 通过 43 项规则 / 83 组页面 / PWA 5 组。后续优化仍需新的明确上传指令。仓库：[nonspt/Rowing](https://github.com/nonspt/Rowing)，在线应用：[划船机](https://nonspt.github.io/Rowing/)。

1.1.0 构建 **aea32d498f64**。[Actions 38359739651](https://github.com/nonspt/Rowing/actions/runs/38359739651) 规则、SVG、构建、72 组页面验收与部署成功。线上 HTTPS 200、设置版本 1.1.0、Service Worker /Rowing/sw.js，构建与本地一致；直接线上 iPad 15、组合 7、UI / 删除 11、计次 7、全屏布局 6、编辑 / 模板 3，共 49 组通过、0 pageerror。

1.0.0 构建 **67ee0b60a73b**。[Actions 38346540301](https://github.com/nonspt/Rowing/actions/runs/38346540301)规则、SVG、构建、63 组页面验收与部署成功。线上 HTTPS 200、设置版本 1.0.0、构建与本地一致；直接线上 UI / 删除 11、计次 / 完整时间线 7、iPad 15、组合 7，共 40 组通过、0 pageerror。下面保留历史发布记录。

0.3.0 构建 **9cae958e7d5d**。[Actions 38336038016](https://github.com/nonspt/Rowing/actions/runs/38336038016)规则、SVG、构建、手机 / 平板 / 组合验收与部署通过。线上 HTTPS 200、设置版本 0.3.0、构建一致；直接线上 iPad 15 + 组合 7 组通过，含完整 27 分钟课程、徒手暂停 / 刷新恢复、实际备份导入、自定义 / 旧计划、手机恢复及离线，0 pageerror。证据见 VALIDATION_REPORT。

上一版 0.2.3 构建 **9130aafde932**；本地 /Rowing/ 下 iPhone Air 10+13 组、iPad mini 15 组通过。[Actions 38199385064](https://github.com/nonspt/Rowing/actions/runs/38199385064)规则、SVG、构建、手机 / 平板验收及部署通过。线上 HTTPS 200、构建与本地一致；直接对线上地址执行完整 iPad mini 15 组通过，0 pageerror，含双主题、自定义计划、实际计时 / 保存、离线重开。详细结果归档于 VALIDATION_REPORT。

Pages 已在此前由用户开启，Source 为 GitHub Actions；本轮无需重复设置。main 更新自动测试、构建、发布。

1.1.0 构建 aea32d498f64；本地 41 项规则、SVG、72 组页面回归、PWA 5 组、生产依赖与许可检查通过。发布与线上 49 组复核通过；详细证据见 VALIDATION_REPORT。

## 构建与路径

工作流使用 Ubuntu 24.04、Node 24、pnpm 11.25.0，第三方 Action 固定提交；当前流程依次执行锁文件安装、43 项规则、SVG 审计、生产构建、/Rowing/ 子路径与 iPhone Air / iPad mini 操作 / 布局与组合训练与 UI / 删除、计次 / 时间线完整流程、上传 dist 与 Pages 发布。构建 contents:read，部署 pages:write / id-token:write。

仅提交源码、锁文件、安装资源、脚本、测试与维护文档；不上传 node_modules、dist、test-results、.env 或用户备份。

Vite base=./；Hash 页面 #/plans；Manifest id / scope=./，start_url=./#/plans。SW 注册基于 document.baseURI，缓存限注册范围。旧 Hash 自动归一至计划页。

Pages 不读取 _headers；构建 HTML 在脚本之前设置 CSP 与 no-referrer。HTTP 专用策略受宿主能力限制。

## 发布验收

pnpm test:pages 挂载无自定义 HTTP 安全头的 /Rowing/，检查路径、图标、SW、CSP、离线与 iPhone Air 10+13 组、iPad mini 15 组、组合训练 7 组及 UI / 删除 / 今天 11 组与计次 7、全屏时间线布局 6、滑块 / 模板模式 3 组及新计划布局 6、紧凑控件 5 组流程（合计 83）。线上可通过 APP_URL 指向 HTTPS 后独立核验，已执行范围见 VALIDATION_REPORT。

报告在忽略的 test-results，测试使用隔离浏览器与合成数据。真实 iOS Safari / 主屏仍需实际设备。

## 更新与数据保护

旧 app 有未完成草稿时阻止 waiting worker 激活。结束或保留备份、处理草稿后，在设置更新版本；接管后才重载，不强制跳过未保存训练。

数据库 1→2 无损升级七个 store。旧记录、计划、学习、草稿保留；导出 v2，导入 v1 / v2。不同源 / 浏览器不自动转移，迁移需导出 → 校验 → 预览 → 确认合并 → 核验。

## 回滚

不能直接把 0.1.x 部署到已有 v2 数据的源。修复应采用保持 v2、组合动作与计次语义兼容的 1.1.x 补丁，或只回退受影响 UI，同时保留 v2 Repository / 校验和新 Plan 定义。通过 main 新增提交重走 CI，不强推或删库恢复。

包含 circuit-1 / circuit-2 的组合备份需支持动作显示和计次语义的构建；0.2.x 不显示徒手 / 换位，0.3.x 不保留计次游标和记录，不作为计次数据的回滚目标。修复采用保留动作 / 游标 / 记录与 v2 数据及五秒调整阶段、每周五次及混合恢复语义的 1.2.x 补丁，或只回退 UI 布局，见 ADR 0004 / 0006。

v2 备份只能导入仍支持 v2 的已验证构建。完整回滚演练未执行，见 KNOWN_ISSUES 与 [ADR 0003](../architecture/ADR/0003-focused-plans-v2.md)。

依据：[GitHub 自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
