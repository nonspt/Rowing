# 项目开发规则入口

用户 2026-10-08 提供的 Vibe Coding 长期约定适用于本项目；明确的用户需求和本项目已确认约束优先。

任务顺序：读取 [PROJECT_CONTEXT](../project/PROJECT_CONTEXT.md) → 本入口 → 相关专项规范 → 现有实现与状态 → 计划、复用、实施、验证、评审和同步文档。

规则引用唯一的共享来源，不复制 26 份专项细则，也不把其他项目的当前状态当成这里的事实。

## 共享规范位置

长期规范根目录：`D:/OpenAIData/CodexHome/developer-standards/vibe-coding/`；专项规范在其中 `docs/standards/`。

公开仓库不携带个人机器的共享目录。克隆环境缺少该目录时，先依据本入口、PROJECT_CONTEXT 和用户提供的规则执行；专项规范由维护者提供可访问位置，不把不可达绝对链接视为已读取。

- [AI_CODING_RULES](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/AI_CODING_RULES.md)、[AI_AGENT_WORKFLOW](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/AI_AGENT_WORKFLOW.md)、[DEVELOPMENT](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/DEVELOPMENT.md)：常规开发。
- [UI_DESIGN_SYSTEM](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/UI_DESIGN_SYSTEM.md)、[SVG_ICON_SPEC](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/SVG_ICON_SPEC.md)、[ACCESSIBILITY](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/ACCESSIBILITY.md)：界面。
- [DATA_GOVERNANCE](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/DATA_GOVERNANCE.md)、[BACKUP_RECOVERY](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/BACKUP_RECOVERY.md)：数据与恢复。
- [TESTING](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/TESTING.md)、[DEFINITION_OF_DONE](D:/OpenAIData/CodexHome/developer-standards/vibe-coding/docs/standards/DEFINITION_OF_DONE.md)：测试与完成标准。
- 架构、发布、安全和依赖变化时按任务再读 `CHANGE_MANAGEMENT`、`RELEASE`、`SECURITY`、`DEPENDENCY_MANAGEMENT` 与 `DOCUMENTATION` 等对应规范。

若共享长期目录不可用，工作区规范镜像位于 `../../../开发规范/docs/standards/`，先确认与用户约定一致再使用。跨机器交付时应提供可访问的共享规则位置，而不是依赖不可达绝对路径。

用户已于 2026-10-08 明确授权“按照开发文档开始开发”。按 [开发文档](../product/开发文档_V1.0.md)推进首版手动记录 P0；设备、视频、云同步和外部部署按各自阶段实施，不把预览当作正式完成。
