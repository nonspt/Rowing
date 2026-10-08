# CURRENT_STATUS

更新：2026-10-08。当前 **0.1.2 部署预览**；整体 **PARTIALLY DONE**。

发布准备：必要文件与 GitHub Pages Actions 工作流已就绪；/Rowing/ 子路径与 iPhone Air 20 组本地模拟已通过。Pages 开启与线上验收待完成，不能据此声称网站已上线。目标网址 https://nonspt.github.io/Rowing/；详情见 [部署说明](DEPLOYMENT.md)。

| 阶段 | 状态 | 结果与剩余范围 |
| --- | --- | --- |
| D0 设计 | DONE | 文档与用户范围确认完成 |
| D1 UI | PARTIALLY DONE | 简化四标签、双主题、五种屏宽与 iPhone Air / 200% 文字模拟；iOS / VoiceOver 实机待验 |
| D2 跟练 | PARTIALLY DONE | 用户已确认 10 门课程；六步 SVG 演示、暂停、恢复及完整课程结束已验；实机音频与后台待验 |
| D3 数据与计划 | PARTIALLY DONE | 事务、计划、保存重试、编辑、备份、跨窗口及 1000 条流程已验；未来迁移和 10MB / 10000 条边界待验 |
| D4 PWA | PARTIALLY DONE | 构建、安装资源、离线、等待更新与旧缓存清理已验；iPhone HTTPS 主屏及正式发布待做 |
| D5 P1 | PLANNED | 视频、自定义、扩展内容与高级趋势未实施 |
| D6 设备 | PLANNED | 没有指定机型，没有实现设备连接或控制 |

[验收记录](VALIDATION_REPORT.md)提供实际证据。可运行源码、构建、启动器和维护文档已交付；桌面浏览器通过不等于 iOS 真机通过。

下一阶段完成 GitHub Pages 开启与 HTTPS 线上核验，再按 [已知事项](KNOWN_ISSUES.md)完成 iPhone / VoiceOver / 字体实机检查；参数模拟详见 [iPhone Air 验收](IPHONE_AIR_ACCEPTANCE.md)。支持设备仍需实机确认。首版仍手动、无账号、无云同步。
