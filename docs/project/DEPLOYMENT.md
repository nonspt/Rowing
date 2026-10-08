# GitHub Pages 部署

2026-10-08；0.1.2 部署预览。仓库：[nonspt/Rowing](https://github.com/nonspt/Rowing)，在线应用：[划船机](https://nonspt.github.io/Rowing/)。Pages 已开启，[首次发布](https://github.com/nonspt/Rowing/actions/runs/37737172486)第 2 次执行成功；构建 d1d532145d75，HTTPS 200。实际验证见 VALIDATION_REPORT。

## 构建与首次开启

Source 已由用户在仓库 Settings → Pages → Build and deployment 中选为 GitHub Actions。连接器没有 Pages 管理接口；首次运行因站点未开启在 configure-pages 返回 Not Found，用户开启后重跑失败任务，发布成功。

main 推送或 Actions → Deploy GitHub Pages → Run workflow 触发部署。工作流使用 Ubuntu 24.04、Node 24、pnpm 11.25.0，固定第三方 Action 提交。锁文件安装 → 12 项核心测试 → SVG 审计 → TypeScript / PWA 构建 → Pages 子路径与 iPhone Air 模拟 → 上传 dist → github-pages 环境部署。只授予构建 contents:read 与部署 pages:write / id-token:write，不存储个人令牌。

Git 仓库包含源码、public 安装资源、脚本、测试、文档与锁文件；不包含 node_modules、dist、test-results、.pnpm-store、.env 或真实训练备份。初次克隆先运行 pnpm install --frozen-lockfile 与 pnpm build，然后 pnpm preview。

## 路径与安全

Vite 默认 base 为 ./，相对资源支持 /Rowing/；Hash 路由无须服务器重写。Manifest 的 id / start_url / scope 相对于自身路径；SW 按 document.baseURI 注册，缓存范围限制在注册 scope。

Pages 使用受信任 HTTPS。构建 HTML 在脚本之前注入 CSP 与 no-referrer 策略；_headers 为其他支持它的宿主保留，GitHub Pages 不读取它。HTML CSP 无法设置 frame-ancestors；nosniff、Permissions-Policy 与精确 HTTP 缓存头也不能通过该文件控制。不能把本地预览 HTTP 头测试写成线上头测试。

本地、线上和其他浏览器的 IndexedDB 不自动同步。迁移记录时先在原环境导出 JSON，在线上选文件 → 校验 → 预览 → 确认合并 → 核验。已有本机冲突保留，不删库或自动覆盖。

## 核验与回滚

本地 pnpm test:pages 使用无自定义安全头的临时服务器挂载 /Rowing/，检查安装资源、Manifest、SW scope、HTML CSP、四页离线与 iPhone Air 20 组流程。线上需单独检查 HTTPS 200、资源、Manifest / SW、四页、记录、主题、备份及离线；iOS 主屏与 VoiceOver 仍需实际 iPhone。

本次已对线上地址完成上述资源核验与 iPhone Air 20 组流程，0 pageerror。浏览器脚本通过 APP_URL 指向线上；导航按 DOM / 可见控件判断就绪，离线检查单独等待 SW 控制。报告与截图位于被 Git 忽略的 test-results，不上传合成训练备份。

回滚通过 main 上新增 revert 提交恢复已验证源码，重新走同一构建与部署流程；不强推、不删除数据库。不在未保存训练中强制激活版本。未来破坏性数据库变化必须补迁移与回滚方案。

依据：[GitHub 自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[configure-pages 首次开启权限](https://github.com/actions/configure-pages/blob/v5/action.yml)。
