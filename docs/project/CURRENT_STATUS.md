# CURRENT_STATUS

更新：2026-10-08。当前 **0.1.2 部署预览**；整体 **PARTIALLY DONE**。

部署预览已上线：[划船机](https://nonspt.github.io/Rowing/)。76 个必要文件已上传，Pages Source 为 GitHub Actions；[首次发布](https://github.com/nonspt/Rowing/actions/runs/37737172486)第 2 次执行成功，构建 d1d532145d75。云端核心 12 项与 iPhone Air 20 组通过；线上 iPhone Air 20 组、离线重开、HTTPS 200、安装图标、Manifest / SW scope 和深色已核验。详细检查见 [验收记录](VALIDATION_REPORT.md)与 [部署说明](DEPLOYMENT.md)。

| 阶段 | 状态 | 结果与剩余范围 |
| --- | --- | --- |
| D0 设计 | DONE | 文档与用户范围确认完成 |
| D1 UI | PARTIALLY DONE | 简化四标签、双主题、五种屏宽与 iPhone Air / 200% 文字模拟；iOS / VoiceOver 实机待验 |
| D2 跟练 | PARTIALLY DONE | 用户已确认 10 门课程；六步 SVG 演示、暂停、恢复及完整课程结束已验；实机音频与后台待验 |
| D3 数据与计划 | PARTIALLY DONE | 事务、计划、保存重试、编辑、备份、跨窗口及 1000 条流程已验；未来迁移和 10MB / 10000 条边界待验 |
| D4 PWA | PARTIALLY DONE | GitHub Pages HTTPS 部署、构建、安装资源、离线、等待更新与旧缓存清理已验；iPhone 主屏实机及正式版本质量验收待做 |
| D5 P1 | PLANNED | 视频、自定义、扩展内容与高级趋势未实施 |
| D6 设备 | PLANNED | 没有指定机型，没有实现设备连接或控制 |

[验收记录](VALIDATION_REPORT.md)提供实际证据。可运行源码、构建、启动器和维护文档已交付；桌面浏览器通过不等于 iOS 真机通过。

下一阶段按 [已知事项](KNOWN_ISSUES.md)完成 iPhone / VoiceOver / 字体实机检查；参数模拟详见 [iPhone Air 验收](IPHONE_AIR_ACCEPTANCE.md)。支持设备仍需实机确认。首版仍手动、无账号、无云同步。
