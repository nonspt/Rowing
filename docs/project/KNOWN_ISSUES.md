# KNOWN_ISSUES

2026-10-08，0.1.2 部署预览。

| ID | 已知事项 | 影响与后续 |
| --- | --- | --- |
| K01（已解除） | 用户已确认训练内容 1.0.0 | 保留旧草案快照；不宣称第三方审核 |
| K02 | 无 iOS 主屏 / Safari、VoiceOver 和 200% 字体实机结果 | iPhone Air / 200% 浏览器模拟已补充；真实 Safari / 主屏需要受信任 HTTPS，仍不能声称真机通过 |
| K03 | 后台、锁屏播报及常亮受平台限制 | 挂起确认，不补算未知活动，常亮失败文字降级 |
| K04 | 纯 PWA 无 UIKit / SwiftUI 和通用 Safari Web Bluetooth | iOS 风格 Web 组件；设备后续专项 |
| K05 | 本地数据受清理、源变化、存储回收影响 | 支持 JSON 备份及临时模式，不承诺永久或多端同步 |
| K06 | 仅备份合并并保留本机冲突 | 未提供覆盖、完整替换、媒体恢复或重置 |
| K07 | 10000 条 / 10MB、未来迁移与发布回滚未验 | v1 无破坏性迁移；未来需夹具与 ADR |
| K08 | 无移动端 LCP / CLS / 长任务与低电量结果 | 构建体积和容量检查不能替代移动真机性能 |
| K09 | GitHub Pages 设置与线上核验待完成；品牌与机型未定 | 目标 /Rowing/ 已本地模拟；开启及 HTTPS 结果见 DEPLOYMENT |
| K10 | GitHub Pages 不支持项目自定义 HTTP 安全头 | HTML CSP / Referrer 策略已实现；不能宣称服务器发送 frame-ancestors、nosniff 或 Permissions-Policy |

本轮修复并回归：暂停草稿租约误阻塞；可变对象比较导致计划 / 草稿漏写；原生 dialog 遮盖错误提示；接管前刷新；手动编辑时长后结束时间未同步。证据见 [验收记录](VALIDATION_REPORT.md)。
