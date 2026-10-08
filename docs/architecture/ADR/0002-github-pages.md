# ADR 0002：GitHub Pages 部署预览

日期：2026-10-08。状态：Accepted；用户明确授权上传至 nonspt/Rowing 并开启 Pages。

采用公开源码仓库与 GitHub Actions 构建 dist；main 测试通过后部署至 /Rowing/。复用现有 React / Vite、相对 base、Hash 导航、Manifest 与 Service Worker，不引入运行时依赖或账号系统。安装 PNG 保留 SVG 生成来源。

Pages 无自定义 _headers 支持，改由构建 HTML 执行其支持的 CSP 与 Referrer 策略；完整 HTTP 策略仍用于原生本地预览和支持自定义头的宿主。此能力边界保留在 KNOWN_ISSUES，不假称已配置服务器专用策略。

源码与训练数据分离，实际训练数据不上传 GitHub；从 localhost 到 HTTPS 站点时按现有 JSON 校验与合并流程迁移。数据库结构与内容版本不变。

连接器缺少 Pages 管理接口时，由管理员选择 Pages Source 为 GitHub Actions；其余文件交付、验证与自动部署配置照常完成。线上验收和 iOS 实机结果各自记录。回滚采用普通 revert 提交并重建，不删除数据或强制更新。
