# CURRENT_STATUS

更新：2026-10-10。当前 **0.2.2 预览版**。

预览地址：[打开应用](https://nonspt.github.io/Rowing/#/plans)。当前构建 **574c08e6a7ee**，发布使用 [GitHub Actions](https://github.com/nonspt/Rowing/actions/workflows/pages.yml)。本轮本地 22 项规则、iPhone Air 10+13 组和 PWA 5 组已通过，0 pageerror；线上验证结果归档于 VALIDATION_REPORT。

本轮已实现用户要求的精简范围：训练计划 + 跟练。六种有氧 / 无氧模板支持 2、4、6、8、12 周，自定义支持 1–52 周；原多页功能入口已删除。

跟练用力上限 16，按原目标 ×1.6 四舍五入，阶段切换时自动显示；旧草稿同样适配。放大当前用力与下一段类型 / 时长，动作提示缩小。保持无图示和 ≥64px 操作按钮。

| 范围 | 状态 | 验证 |
| --- | --- | --- |
| 计划与自定义 | 已实现 | 模板完整周期、参数、编辑与保存、切换、自动推进 |
| 跟练 | 已实现 | 开始、暂停、退出、刷新恢复、提前结束、完整课程、保存失败重试 |
| 数据兼容 | 已验证 | 真实 IDB v1→v2、旧记录 / 草稿 / 学习保留、v1 / v2 备份、1000 条导入导出 |
| UI / SVG | 已验证参数模拟 | 双主题、五类视口、200% 字体、44px 点击区域、模态焦点、SVG 审计 |
| PWA | 本地已验证 | 子路径、离线、安装资源、CSP、等待更新与旧缓存清理 |
| GitHub Pages | 已发布并验收线上 | [自动部署](https://github.com/nonspt/Rowing/actions/workflows/pages.yml) |
| 实际 iOS | 待设备验证 | Safari / 主屏 / VoiceOver / 锁屏声音 |

当前任务的产品功能已完成；真实 iOS 质量门禁仍为 PARTIALLY DONE，不阻止按用户已授权方式发布预览。实际执行证据见 [验收记录](VALIDATION_REPORT.md)。

不再把教学、手动补录、趋势和设备列为待开发需求。以后扩展须由用户重新确认。
