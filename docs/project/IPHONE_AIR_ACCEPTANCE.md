# iPhone Air 参数模拟验收

更新：2026-10-10；应用 0.2.2。

[Apple 技术规格](https://www.apple.com/iphone-air/specs/)分辨率 1260×2736；[Apple 布局规格](https://developer.apple.com/design/human-interface-guidelines/layout)列出 420×912 pt、@3x。模拟采用 420×912 CSS px、DPR 3、移动视口和触控；PNG 直接核验 1260×2736。

实际引擎为 Windows Chrome headless / Chromium 135.0.7049.85。没有使用 Safari、iOS 模拟器或真实 iPhone。

## 本轮检查

- 10 组操作流程：模板、自定义、切换、暂停 / 恢复、租约、保存失败、备份、离线完整训练、v1 数据升级、无氧确认、临时模式与 16 级用力的逐阶段显示（按机器报告的 10 组归档）。
- 13 组专用检查：尺寸与触控，五种视口 × 双主题的计划 / 模板 / 预览 / 自定义 / 跟练，200% 字体，模态键盘与焦点。
- 竖屏 420×912、浏览器工具栏 420×760、横屏 912×420、窄屏 320×720、桌面 1200×900。
- 安全区压力：竖屏 top 62 / bottom 34；横屏 left / right 62、bottom 21。数据为注入 Token 的压力值，不是实际 Safari 测量值。
- 200% 采用根字号 34px，对照默认 17px。主要操作至少 44×44，文本与表单可滚动访问。
- 跟练无图示，主要操作按钮高度至少 64px，断言已通过。
- 用力上限 16，热身 / 工作 / 恢复 / 放松自动换算，旧草稿显示与原始课程保留均核验。五种视口 × 双主题断言用力字号至少为动作提示两倍，下一段类型 / 时长字号大于动作提示；辅助文字为常规字重。
- 双主题文本 / 按钮对比度 ≥4.5；全部图标 / 进度为 SVG，表单保留原生 HTML。
- 截图已人工查看当前计划浅色 / 深色、自定义表单与跟练。截图与 JSON 机器报告位于 test-results/iphone-air，属于未提交的验收产物。

运行 pnpm test:iphone-air；pnpm test:pages 会在 /Rowing/ 子路径完整执行。线上地址通过 APP_URL 指定，发布后需单独验证。

Safari 软键盘、visualViewport、系统字体、VoiceOver、安装主屏、音频与锁屏仍需真实设备验证。
