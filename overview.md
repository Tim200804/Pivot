# Pivot 平台 — 路由守卫、登录拆分与 Mock 稳定性升级

## 完成内容

### 1. ProtectedRoute 路由守卫（App.jsx）
- 新增 `ProtectedRoute` 组件，基于 `UserContext` 的 `user.role` 做权限判断。
- 未登录用户访问任意受保护页面 → 跳转 `/login`。
- 运动员访问 `/coach/*` → 跳转 `/athlete`。
- 教练访问 `/athlete/*` → 跳转 `/coach`。
- 其余未匹配路由 → 跳转 `/login`。

### 2. ErrorBoundary 兜底（新增）
- 新建 `src/components/ui/ErrorBoundary.jsx`。
- 在 `App.jsx` 中用它包裹所有 `Suspense` 懒加载路由。
- 出错时展示 Pivot Logo、简短说明与 Retry 按钮。

### 3. LoginPage 组件拆分
- 将原来 769 行的 `LoginPage.jsx` 拆分为 4 个文件，每个 < 300 行：
  - `LoginPage.jsx`（180 行）：角色选择、Tab 切换、状态协调。
  - `SignInForm.jsx`（172 行）：邮箱登录、快速登录卡片、记住我。
  - `SignUpForm.jsx`（193 行）：注册表单、学校搜索、位置/角色选择、身体数据。
  - `BrandPanel.jsx`（73 行）：左侧品牌与价值主张面板。
- 功能与交互完全保持，未引入行为变化。

### 4. Mock 数据稳定性
- `mockData.js` 中新增顶层常量 `ALERTS`，使用固定时间戳生成。
- `generateAlerts()` 现在返回稳定的 `ALERTS` 常量，保证每次渲染队列一致。
- `AlertContext.jsx` 直接消费 `ALERTS` 常量。
- Morgan 固定红色预警、Jordan 固定黄色预警（原有 athlete 配置已满足）。

### 5. Demo 模式 AI 体验升级
- `aiCoach.js` 重写 Demo fallback：
  - 基于 7 天 HRV/睡眠趋势计算变化百分比与方向。
  - 结合今日心情（mood）、疲劳（fatigue）、动机（motivation）与 journal。
  - 生成 2-3 句有温度、个性化且确定性的回复，不再使用 `Math.random`。
  - 聊天回复也基于同样的数据上下文，按用户意图提供睡眠/HRV/恢复/教练沟通等建议。

## 验证
- 运行 `npm run build` 通过，无编译错误。
- 首屏 index.js gzip 106 KB，整体构建正常。

## 后续建议
- 可在浏览器中实测路由守卫：复制 `/coach` URL 到未登录窗口应被重定向到 `/login`。
- Demo AI 文案可继续根据用户反馈微调语气或信息密度。
