# 依赖与构建成本

1.0.0（2026-10-13）：复用锁文件，无新增 / 升级依赖。当前 JS + CSS gzip 92.8KiB、11 项离线资源 356.3KiB；新增逐动作计次、完整 SVG 时间线与数据删除。本轮生产依赖 audit 无已知漏洞、许可清单检查通过；实际结果见 VALIDATION_REPORT。

0.3.1 更新（2026-10-13）：无新增 / 升级依赖，锁文件复用。JS + CSS gzip 90.0KiB、11 项离线资源 343.5KiB；相对 0.3.0 增加 1.2 / 3.8KiB。SVG 派生安装 PNG 已同步金色。本轮不重复依赖安全 / 许可审计，旧结果作为历史。

0.3.0 更新（2026-10-13）：无新增依赖，锁文件复用。JS + CSS gzip 88.8KiB、11 项离线资源 339.7KiB，相对 0.2.3 增加 3.7 / 15.4KiB。现有依赖未升级；本轮未重复安全 / 许可审计，旧结果仅为历史。

0.2.3 更新（2026-10-12）：无新增依赖，锁文件继续复用。JS + CSS gzip 85.1KiB，11 项离线资源 324.3KiB；相对 0.2.2 增加 0.7 / 3.4KiB。0.2.1 的 pnpm audit --prod 为 0 项已知漏洞，许可检查通过；本轮未重复依赖审计。以下旧版实测保留为历史。

2026-10-08，版本 0.1.0。pnpm-lock.yaml 固定解析结果；项目 .pnpm-store 不提交。

| 依赖 | 版本 | 必要性与成本 | 许可 |
| --- | --- | --- | --- |
| React / React DOM | 19.2.6 | 组件与状态，唯一 UI 框架运行时 | MIT |
| TypeScript | 5.9.3 | 数据契约，仅开发 | Apache-2.0 |
| Vite | 8.0.16 | 开发与构建，仅开发 | MIT |
| plugin-react | 6.0.2 | React 构建，仅开发 | MIT |
| playwright-core | 1.55.1 | 本机 Chromium 测试，不进入前端 | Apache-2.0 |
| types | 锁文件所列 | 仅开发类型 | MIT 等 |

IndexedDB、SW、CSS、SVG、Audio、Wake Lock 均使用原生能力；无数据库、UI、图标、动画、AI 或统计运行时库。核心测试使用 Node 原生测试器。

候选 Vite 8.0.13 安装审计有两个 Windows 开发服务器公告，更新到同主版本 8.0.16 后 pnpm audit 报告 0 项已知漏洞。这是本次结果，不保证永久安全。

pnpm audit:licenses 读取锁文件对应的本地包，包含 MIT、Apache-2.0、ISC、BSD-3-Clause 和构建使用的 Lightning CSS MPL-2.0。运行时原始许可随 [third-party-notices.txt](../../public/third-party-notices.txt)交付。

构建实测 JS + CSS gzip 约 90.6KB；11 项离线资源约 339.9KB（0.1.1），低于 250KB / 5MB 预算。没有远端字体、照片、视频。移动性能仍需真机测量。
