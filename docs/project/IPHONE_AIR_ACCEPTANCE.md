# iPhone Air 模拟验收

日期：2026-10-08；版本：0.1.1 本地开发预览。

## 参数与验收范围

[Apple 技术规格](https://www.apple.com/iphone-air/specs/)公布分辨率 1260×2736；[Apple 布局规格](https://developer.apple.com/design/human-interface-guidelines/layout)列出 420×912 pt、@3x。Web 模拟使用 420×912 CSS px、deviceScaleFactor 3、触控和移动视口。截图 PNG 尺寸直接核验为 1260×2736。

环境为 Windows Chrome / Chromium 135.0.7049.85，使用真实构建和 localhost 的 CSP 安全头；没有伪装为 Safari，也没有使用 Apple 系统字体、iOS 模拟器或实际 iPhone。

| 场景 | 模拟条件 |
| --- | --- |
| 主屏尺寸 | 420×912，浅色和深色 |
| 工具栏占用 | 420×760，近似可用视口缩小 |
| 横屏 | 912×420，浅色和深色 |
| 安全区压力 | 竖屏 top 62 / bottom 34；横屏 left/right 62 / bottom 21 |
| 输入界面 | 420×512，近似键盘占用后的可用空间 |
| 文字放大 | 根字体 34px，200% 相对字体 |
| 辅助偏好 | 系统主题实时切换、减少动态效果、键盘展开 |
| 断网 | 完成 SW 安装后离线重开 |

安全区数字是注入 CSS Tokens 的测试压力值，**不是已测得的 iPhone Air Safari 系统值**。工具栏和键盘采用视口缩小近似，不能据此声称真实软键盘、原生选择器或 Safari visualViewport 行为通过。

## 操作与数据核验

执行入口：`pnpm test:iphone-air`。前半复用主浏览器验收并在关键流程使用 420×912、DPR 3；后半执行专用布局与触控检查。

覆盖首次设置、课程、三类计划入口与高强度条件、学习自检、完整跟练、暂停与刷新恢复、有效租约、保存失败重试、编辑、删除、JSON 下载与合并、临时模式、离线启动。

专用检查覆盖双主题三种视口的四个页面、按钮和 Label 44px 触控区域、课程筛选、展开阶段、轻松替代、六步 SVG 动画、暂停／慢速／静态模式、隐藏冻结、200% 文字、缩短视口下填写记录、计划日期冲突提示及调整／跳过／重复、主题与提示音、SVG 标签、键盘展开、离线动作资源。

测试使用独立浏览器和合成数据，不修改用户浏览器中的记录。最终通过数量和构建标识以[机器报告](../../test-results/iphone-air/report.json)及[总验收记录](VALIDATION_REPORT.md)为准。

## 截图

[今日浅色](../../test-results/iphone-air/today-light.png) · [今日深色](../../test-results/iphone-air/today-dark.png) · [学习与动作图](../../test-results/iphone-air/learn-dark.png) · [六步演示](../../test-results/iphone-air/animation-steps-dark.png) · [200% 表单](../../test-results/iphone-air/large-text-dark.png)。

## 仍需实际设备验证

Safari 和主屏安装、动态安全区、软键盘遮挡和自动缩放、系统选择器、VoiceOver、Dynamic Type、后台／锁屏与音频／常亮、系统存储回收、实际手机性能尚未验收。当前结论为 **iPhone Air 参数下的浏览器模拟验收**，不能填写“iOS 真机通过”。
