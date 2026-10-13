# 划船机

家用划船机训练计划 PWA，当前 **V1.1.0 正式版**。仅保留计划与跟练，采用 iOS 风格和系统深色模式。

[在线使用](https://nonspt.github.io/Rowing/) · [源码](https://github.com/nonspt/Rowing) · [部署状态](https://github.com/nonspt/Rowing/actions/workflows/pages.yml)

## 使用

1. 选择有氧 / 无氧模板，或创建自定义计划。
2. 查看周日程，进入对应课程。
3. 开始跟练；支持暂停、退出恢复、提前结束和自动保存进度。

- 六种模板，周期为 2、4、6、8、12 周。
- 自定义 1–52 周：名称、类型、开始日期、频次、热身、放松；有氧可调主训练时长，无氧可调工作 / 恢复秒数和组数。
- 新无氧模板加入快划、深蹲、俯卧撑、专门换位与休息；模板和自定义均可分别为动作选择计时或计次，或保留仅划船。旧无氧计划可显式加入组合，只更新待训练课程。
- 更换计划可恢复已保存计划；编辑自定义只改变未完成课程，保留已完成快照与已有读数。
- 主界面只保留跟练卡与日程卡，周次 / 总周期 / 每周完成次数融合到日程卡右上角的原生选择中。教学、课程浏览、历史统计、手动补录入口已移除。
- 设置提供主题、提示音、备份、安装 / 更新和删除所有数据；删除需预览范围与主动确认，可先导出备份。
- 徒手按时间自动倒计时；按次数显示大字目标，主动确认完成后进入休息。记录实际用时与确认次数，预计时长不决定计次结束。
- 自定义两栏对齐，滑块与准确数值输入同步；采用无氧模板前可分别选择徒手计时或计次。预设详情仅日期和按课程类型 / 结构变化分开的训练结构。
- 连续划船用力改变前预留 5 秒设备调整；徒手和换位不加时，休息名称统一为站立休息。未完成草稿和已完成 / 跳过快照不自动改写。
- 六种预设提供心率估算参考，不记录原始身体信息；短间歇不追心率，徒手不设心率达标要求，说明与来源可在设置查阅。
- 前台计时；切出、锁屏或长间隔暂停，不补算后台时间。
- 跟练用力上限 16，各阶段按原目标比例换算并四舍五入；突出用力数值与下一段，动作提示使用较小辅助文字。
- iPad mini 7 横屏：首页一屏两卡，左卡显示无标题的简要结构。跟练为独立全屏页面，左侧完整时间线、中间更宽的计时 / 操作、右侧上下排列用力 / 下一段。时间线只在自己的区域内滚动，自动定位当前阶段；已完成 / 当前 / 待训练同时以文字和颜色区分。
- 数据保存在当前浏览器，无账号、设备连接和云同步。旧版数据无损升级为 v2，支持 v1 / v2 JSON 备份合并。
- 双主题统一暖金色；浅色强调文字采用金棕色，深色背景 / 卡片 / 次级面板分层。训练日加粗，今天按计划时区框选；更换计划为卡内紧凑按钮。
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

保持预览运行后可单独执行 pnpm test:browser、pnpm test:pwa、pnpm test:iphone-air、pnpm test:ipad-mini、pnpm test:circuit、pnpm test:ui-review、pnpm test:counted、pnpm test:follow-layout、pnpm test:editor-options。CHROME_PATH 指定 Chrome，APP_URL 指定目标；测试使用隔离浏览器和合成数据，报告与截图在被忽略的 test-results。test:pages 同时执行手机、平板、组合训练及 UI / 数据删除、计次与完整时间线验收。

main 更新后 Actions 自动构建部署。相对资源、Manifest 和 Service Worker 支持 /Rowing/；Pages 通过 HTML 执行 CSP / Referrer 策略，不读取自定义 _headers。

本地与线上数据属于不同源。迁移时从原环境导出备份，再在线上校验、预览、确认合并。数据库仍为 v2；包含计次 / 调整数据后，回滚应采用保留两者语义的 1.1.x 兼容补丁，见 ADR 0006 / 0007。

## 文档

- [当前开发文档](docs/product/训练计划开发文档_V2.md)、[组合训练说明与来源](docs/product/组合训练说明.md)、[心率参考与来源](docs/product/心率参考说明.md)
- [项目事实](docs/project/PROJECT_CONTEXT.md)、[当前状态](docs/project/CURRENT_STATUS.md)
- [验收记录](docs/project/VALIDATION_REPORT.md)、[iPhone Air 模拟](docs/project/IPHONE_AIR_ACCEPTANCE.md)
- [iPad mini 7 横屏适配与模拟](docs/project/IPAD_MINI_ACCEPTANCE.md)
- [已知事项](docs/project/KNOWN_ISSUES.md)、[技术债务](docs/project/TECH_DEBT.md)
- [部署与回滚](docs/project/DEPLOYMENT.md)、[数据升级决策](docs/architecture/ADR/0003-focused-plans-v2.md)、[组合数据兼容](docs/architecture/ADR/0004-bodyweight-circuit.md)、[确认删除](docs/architecture/ADR/0005-confirmed-local-data-reset.md)、[计次动作与实际用时](docs/architecture/ADR/0006-counted-bodyweight-sets.md)、[设备调整兼容](docs/architecture/ADR/0007-manual-rowing-adjustments.md)
- [SVG 依据](docs/product/动作图示规范.md)、[依赖](docs/architecture/DEPENDENCIES.md)、[变更历史](CHANGELOG.md)

iPhone Air 与 iPad mini 7 分辨率、触控、双主题和文字放大通过 Chromium 参数模拟验证。真实 iOS / iPadOS Safari、主屏、VoiceOver 与锁屏声音仍待实际设备验证。
