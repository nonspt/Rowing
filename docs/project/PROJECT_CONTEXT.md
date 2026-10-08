# PROJECT_CONTEXT

更新：2026-10-08。应用 **0.1.2 部署预览**，数据库结构 1，内容 1.0.0（用户确认），规则 plan-rules-1。

## 已确认与当前事实

- 家用划船机 PWA：教学、针对性课程、有氧及无氧方向计划、iOS 风格与系统深色模式。
- 用户先要求文档，随后授权按照文档开始开发；首版手动记录，设备后续接入。
- 用户授权上传至 nonspt/Rowing 并开启 GitHub Pages；仓库保存源码、锁文件、安装资源、测试、启动器与文档，Actions 自动构建部署。实际启用与线上验证见 CURRENT_STATUS。
- GitHub Pages 已开启，0.1.2 HTTPS 预览已上线 https://nonspt.github.io/Rowing/；本地目录已关联 origin/main。云端测试、构建和部署通过；真实 iOS 仍待验。
- 已实现四标签、10 门课程、三类四周模板、SVG 教学、跟练、计划、记录、备份、PWA 离线与更新。
- 用户已确认训练内容，新增课程 / 计划使用内容版本 1.0.0；未声称第三方专业审核。旧 draft-1 快照和备份继续兼容，已有记录保留原值。
- 按用户要求简化四页面，详细说明按需展开；动作图示依据 Concept2 官方规则统一为原创 SVG，学习支持六步动画。
- 目标屏幕为 iPhone Air，完成浏览器参数模拟；没有 iOS 真机结果，整体仍 PARTIALLY DONE。

## 实际架构

- React / React DOM 19.2.6、TypeScript 5.9.3、Vite 8.0.16；原生 CSS、SVG、SW，无额外 UI / 图标框架。
- src/ui 展示；application 用例与控制器；domain 类型、规则、校验与计时；repositories 事务；adapters 导出、声音、常亮和 PWA。
- src/content 是课程与教学的实现来源；[开发文档](../product/开发文档_V1.0.md)是设计依据；实际类型由 src/domain/types.ts 维护。
- IndexedDB home-rower-db v1：profiles、lessonProgress、plans、scheduledSessions、drafts、workouts、meta；LocalStorage 只存主题。
- 事务完成后才显示成功；修改前冻结比较基线，避免原地修改漏写。sessionId 唯一；草稿 owner / lease / revision 管理跨窗口。
- 前台 performance.now 计时；隐藏或长间隔挂起，后台不补算。暂停草稿可主动接管，旧 revision 失效；其他窗口运行租约不可抢占。
- 当前周主动进阶；日程和历史绑定课程快照，不随内容升级改写。
- 备份采用保守合并，不提供覆盖、完整替换或删库重置；校验与 CAS 先于原子提交。
- PWA 防止新旧 HTML / JS 混用；等待 worker 检查草稿后激活，接管后重载。
- 静态资源使用相对 base、Hash 导航与相对 Manifest / SW scope，目标路径 /Rowing/。GitHub Pages 使用构建 HTML 的 CSP / Referrer 策略，不应用 _headers；决策见 ADR 0002。

## 入口与约定

[README](../../README.md)、[CURRENT_STATUS](CURRENT_STATUS.md)、[VALIDATION_REPORT](VALIDATION_REPORT.md)、[iPhone Air 模拟](IPHONE_AIR_ACCEPTANCE.md)、[动作图示](../product/动作图示规范.md)、[KNOWN_ISSUES](KNOWN_ISSUES.md)、[TECH_DEBT](TECH_DEBT.md)、[ADR](../architecture/ADR/0001-local-first-ios-pwa.md)、[依赖](../architecture/DEPENDENCIES.md)、[CHANGELOG](../../CHANGELOG.md)。

先读本文件，再读 [AI_CODING_RULES](../standards/AI_CODING_RULES.md)。保护用户数据，不删库迁移、不在训练中强制更新；设备、云同步和发布等重大改变需说明影响并记录决策。
