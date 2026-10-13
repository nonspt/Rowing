# ADR 0005：明确确认后清空本机数据

日期：2026-10-13。状态：接受；应用 0.3.1。

用户明确要求设置提供删除所有数据。复用 Repository 的 v2 多 store 原子事务，不删除数据库，不更换结构、迁移、缓存或备份格式。

## 决策

- 设置入口 → 展示计划 / 日程 / 记录数量和完整范围 → 可先导出备份 → 主动勾选保留确认 → 确认删除。取消、关闭、Escape 均不修改数据。
- 删除包含 profile、lessons、plans、scheduled、draft、workouts 和 lastBackupAt。外观重置为 system，声音恢复默认关闭；默认设置在重开或创建计划时按需生成。
- 在同一个事务内校验预览 revision 与其他窗口草稿租约，再清空用户快照。保留 schemaVersion=2 与持续递增的 revision，避免陈旧确认或检查点写回已删除数据。
- 写入失败时事务全部回滚，不留下部分已删除状态。另一窗口持有有效租约时拒绝操作；重新查看后才能确认变更后的数据。
- 保留应用安装、Service Worker、离线资源及其他应用的存储；没有 indexedDB.deleteDatabase、localStorage.clear 或全源 cache 清理。
- 本应用主题 key 归为默认 system，外观可在多个窗口同步。JSON 备份恢复计划、记录、日程、旧学习数据、profile 与草稿；外观 key 不在备份内，恢复后仍为跟随系统。
- 清空后无需刷新即可选择模板 / 自定义。默认 profile 复用 domain/profile；UI 预览对不存在的 profile 有时区缺省处理。
- 临时 Repository 的 transaction 也遵循 Promise 拒绝契约，校验或租约失败不再同步抛出；失败保留旧快照。

## 验证与回滚

规则覆盖完整删除 / 备份恢复、旧检查点拒绝、revision 冲突、有效租约保护及无刷新创建。浏览器以隔离合成数据验证真实 IndexedDB 删除、写入中途异常回滚、下载 / 导入恢复、离线与刷新、取消及放大字体。

无需数据库升级。回滚应使用 v2 / circuit 字段兼容版本；移除删除入口不会恢复用户主动删除的数据，需要用户持有的 JSON 备份。删除不用于升级或调试。
