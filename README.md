# 划船机

家用划船机训练计划 PWA，当前 **0.2.2 预览版**。仅保留计划与跟练，采用 iOS 风格和系统深色模式。

[在线使用](https://nonspt.github.io/Rowing/) · [源码](https://github.com/nonspt/Rowing) · [部署状态](https://github.com/nonspt/Rowing/actions/workflows/pages.yml)

## 使用

1. 选择有氧 / 无氧模板，或创建自定义计划。
2. 查看周日程，进入对应课程。
3. 开始跟练；支持暂停、退出恢复、提前结束和自动保存进度。

- 六种模板，周期为 2、4、6、8、12 周。
- 自定义 1–52 周：名称、类型、开始日期、频次、热身、放松；有氧可调主训练时长，无氧可调工作 / 恢复秒数和组数。
- 更换计划可恢复已保存计划；编辑自定义只改变未完成课程，保留已完成快照与已有读数。
- 主界面为当前计划、下一次跟练、周日程。教学、课程浏览、历史统计、手动补录入口已移除。
- 设置只保留主题、提示音、备份和安装 / 更新。
- 前台计时；切出、锁屏或长间隔暂停，不补算后台时间。
- 跟练用力上限 16，各阶段按原目标比例换算并四舍五入；突出用力数值与下一段，动作提示使用较小辅助文字。
- 数据保存在当前浏览器，无账号、设备连接和云同步。旧版数据无损升级为 v2，支持 v1 / v2 JSON 备份合并。
- 统一 SVG 图标和进度条；安装 PNG 由 SVG 派生以满足平台要求。

## 开发与验收

需要 Node 22.18+、pnpm 11.25.0。首次下载运行：

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

已有构建可双击 [启动预览.cmd](启动预览.cmd)，访问 [本地预览](http://localhost:5188/)。

```powershell
pnpm check
pnpm test
pnpm audit:svg
pnpm test:pages
```

保持预览运行后可单独执行 pnpm test:browser、pnpm test:pwa、pnpm test:iphone-air。CHROME_PATH 指定 Chrome，APP_URL 指定目标；测试使用隔离浏览器和合成数据，报告与截图在被忽略的 test-results。

main 更新后 Actions 自动构建部署。相对资源、Manifest 和 Service Worker 支持 /Rowing/；Pages 通过 HTML 执行 CSP / Referrer 策略，不读取自定义 _headers。

本地与线上数据属于不同源。迁移时从原环境导出备份，再在线上校验、预览、确认合并。数据库已升级为 v2，不能直接回滚到只支持 v1 的 0.1.x。

## 文档

- [当前开发文档](docs/product/训练计划开发文档_V2.md)
- [项目事实](docs/project/PROJECT_CONTEXT.md)、[当前状态](docs/project/CURRENT_STATUS.md)
- [验收记录](docs/project/VALIDATION_REPORT.md)、[iPhone Air 模拟](docs/project/IPHONE_AIR_ACCEPTANCE.md)
- [已知事项](docs/project/KNOWN_ISSUES.md)、[技术债务](docs/project/TECH_DEBT.md)
- [部署与回滚](docs/project/DEPLOYMENT.md)、[数据升级决策](docs/architecture/ADR/0003-focused-plans-v2.md)
- [SVG 依据](docs/product/动作图示规范.md)、[依赖](docs/architecture/DEPENDENCIES.md)、[变更历史](CHANGELOG.md)

iPhone Air 分辨率、触控、双主题和文字放大已进行 Chromium 模拟。真实 iOS Safari、主屏、VoiceOver 与锁屏声音仍待实际设备验证。
