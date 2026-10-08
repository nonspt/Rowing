# 划船机

家用划船机健身 PWA，当前 **0.1.2 开发预览**。iOS 风格浅色 / 深色界面，首版手动记录，无账号、设备连接或云同步。

## GitHub Pages

[源码仓库](https://github.com/nonspt/Rowing) · [目标网址](https://nonspt.github.io/Rowing/) · [自动部署](https://github.com/nonspt/Rowing/actions/workflows/pages.yml)

首次发布需在仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。首次部署成功后目标网址可访问；之后推送 main 自动测试、构建并发布。实际发布状态见 [当前状态](docs/project/CURRENT_STATUS.md)，配置与回滚见 [部署说明](docs/project/DEPLOYMENT.md)。

线上与 localhost 属于不同浏览器源，本地记录不会自动转移。需要迁移时先在本地设置中导出 JSON，再到线上设置中校验、预览并确认合并导入。

## 启动

双击 [启动预览.cmd](启动预览.cmd)，或在项目目录运行：

```powershell
node scripts/preview.mjs --open
```

访问 [本地预览](http://localhost:5188/)。从 GitHub 首次下载后先安装依赖并执行 pnpm build，启动器使用生成的 dist。已有 dist 时不需每次安装依赖；启动器优先查找 PATH 或当前用户已存在的 Codex Node 运行时。跨机器使用请安装 Node.js 22.18 或以上。

数据属于当前浏览器源；更换端口、浏览器或安装环境前请备份。iPhone 主屏验证需要受信任 HTTPS，普通局域网 HTTP 不能代表完整 PWA。

## 当前能力

- 今日建议、10 门课程、三类四周模板；按时间提供完整短课替代，可调整日期、跳过、重复和主动进阶。
- 五个教学专题、自有 SVG 动作示意与动作自检，不输出自动动作评分。
- 前台阶段跟练、暂停、提前结束、检查点保存和刷新恢复；后台时间不补算为训练。
- IndexedDB 本地记录、课程快照、计划与学习进度；手动补录、编辑、删除和周摘要。
- JSON 备份、严格校验、预览与保留本机冲突的原子合并；本次不提供覆盖冲突、完整替换或删库重置。
- 系统主题实时跟随、手动浅色 / 深色、统一 SVG 与模态焦点；安装资源、离线缓存、等待版本更新。
- 存储不可用时明确进入临时模式，可导出备份，不假称永久保存。

训练内容已由用户确认（1.0.0）。界面按需展开说明，学习页支持依据官方教学规则绘制的 SVG 六步演示。iPhone Air / 200% 文字浏览器模拟已补充；iOS Safari / 主屏与 VoiceOver 实机验收未完成，当前不是正式发布版本。

## 开发与验证

```powershell
pnpm install --frozen-lockfile --store-dir .pnpm-store
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm preview
```

保持预览服务运行，在另一个终端执行：

```powershell
pnpm test:browser
pnpm test:pwa
pnpm test:iphone-air
pnpm test:pages
pnpm audit
pnpm audit:licenses
pnpm audit:svg
```

浏览器测试默认使用本机 Chrome，可用 CHROME_PATH / APP_URL 指定环境。测试数据属于独立测试浏览器；截图和机器报告在 test-results/，不提交 Git。核心测试使用 Node 原生测试器。

生产构建生成版本化 SW、完整资源清单、HTML CSP / Referrer 策略和 _headers。GitHub Pages 不应用自定义 _headers，HTML 策略不包含 frame-ancestors、nosniff 或 Permissions-Policy 等 HTTP 专用策略；本地预览服务器会发送完整安全头。相对资源路径支持静态子目录，页面使用 Hash 导航。

## 文档入口

| 文档 | 用途 |
| --- | --- |
| [开发文档](docs/product/开发文档_V1.0.md) | 产品设计与依据 |
| [项目上下文](docs/project/PROJECT_CONTEXT.md) | 实际架构 |
| [当前状态](docs/project/CURRENT_STATUS.md) | 阶段进度 |
| [验收记录](docs/project/VALIDATION_REPORT.md) | 实际检查及限制 |
| [iPhone Air 模拟](docs/project/IPHONE_AIR_ACCEPTANCE.md) | 参数、触控、文字及截图 |
| [动作图示规范](docs/product/动作图示规范.md) | 官方参考与 SVG 实现 |
| [已知事项](docs/project/KNOWN_ISSUES.md) | 未完成范围 |
| [技术债务](docs/project/TECH_DEBT.md) | 维护事项 |
| [依赖说明](docs/architecture/DEPENDENCIES.md) | 成本、安全与许可 |
| [开发规则](docs/standards/AI_CODING_RULES.md) | 共享约定 |
| [架构决策](docs/architecture/ADR/0001-local-first-ios-pwa.md) | 技术取舍 |
| [变更记录](CHANGELOG.md) | 版本历史 |

下一阶段：完成 Pages 开启与线上核验，再进行 iPhone HTTPS 主屏、VoiceOver / 字体放大实机验收。设备仍为后续专项。
