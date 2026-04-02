# 登录页重构设计（基于 ui/login.pen）

## 1. 背景与目标

当前后台登录页已具备可用的登录接口链路，但视觉风格与 `ui/login.pen` 画布不一致，且注册/找回密码交互未按画布进行统一承载。本次设计目标是在**不改变现有登录接口逻辑**的前提下，完成登录页与两个弹窗的结构和视觉重构。

本次范围覆盖：

- `/login` 登录主页面（浅色科技风）
- 注册弹窗（展示级交互，不接后端）
- 找回密码弹窗（展示级交互，不接后端）

明确不在本次范围：

- 新增注册/找回密码后端接口
- 修改现有登录接口请求参数、响应处理、Token 写入、跳转策略

## 2. 约束与决策

### 2.1 约束

- 保持现有 `ApiPassport.passwordLogin` 登录流程不变。
- 仅做前端展示级弹窗交互，注册/找回不触发真实接口。
- 登录相关代码集中到 `admin-rsbuild/src/routes/login/` 目录。
- 视觉风格严格对齐 `ui/login.pen`（方案 3A）。

### 2.2 关键决策

- 采用“**路由逻辑不动，视图分层重组**”方案：
  - `Route` 层继续负责 mutation、token 与 redirect。
  - 页面层负责视觉编排和弹窗状态调度。
  - 弹窗组件只处理本地表单校验和关闭反馈。

## 3. 目标结构设计

### 3.1 文件组织（集中到登录目录）

- `admin-rsbuild/src/routes/login/index.tsx`
- `admin-rsbuild/src/routes/login/#LoginPage.tsx`
- `admin-rsbuild/src/routes/login/#LoginMainCard.tsx`
- `admin-rsbuild/src/routes/login/#RegisterModal.tsx`
- `admin-rsbuild/src/routes/login/#ForgotModal.tsx`
- `admin-rsbuild/src/routes/login/#login.styled.tsx`
- `admin-rsbuild/src/routes/login/#login-form.styled.tsx`

说明：

- `index.tsx` 作为路由文件，使用 `createFileRoute('/login')` 导出 `Route`。
- `#` 前缀文件作为页面私有实现，避免被路由扫描器误识别。

### 3.2 组件职责边界

- `index.tsx`
  - 维持 `useMutation(ApiPassport.passwordLogin)`。
  - 成功后执行 `setToken(data.token)` 与 `navigate({ to: search.redirect, replace: true })`。
  - 失败时透传 `errorMessage`。
- `#LoginPage.tsx`
  - 管理 `registerOpen`、`forgotOpen`。
  - 组合品牌区、主登录卡片与两个弹窗组件。
  - 接收路由层 `loading/errorMessage/onSubmit`。
- `#LoginMainCard.tsx`
  - 呈现账号密码表单。
  - 触发“注册”和“找回密码”弹窗开关。
  - 不关心 token 与跳转。
- `#RegisterModal.tsx`、`#ForgotModal.tsx`
  - 仅前端校验、提示、关闭与重置。
  - 不发起任何后端请求。

## 4. 数据流与状态设计

### 4.1 登录主链路（保持不变）

1. 用户在登录卡片输入 `username/password` 并提交。
2. `index.tsx` 调用 `ApiPassport.passwordLogin`。
3. 成功：写入 token，跳转到 `redirect` 或默认首页。
4. 失败：将错误信息展示到登录表单顶部警示区。

### 4.2 弹窗链路（展示级）

- 注册弹窗：
  - 打开后录入字段 -> 本地规则校验 -> 成功提示/关闭 -> 表单重置。
- 找回弹窗：
  - 打开后录入字段 -> 本地规则校验 -> 成功提示/关闭 -> 表单重置。

### 4.3 状态归属

- `loading/errorMessage`：路由层（来自 mutation）
- `registerOpen/forgotOpen`：页面层（`#LoginPage.tsx`）
- 表单字段与即时校验状态：弹窗组件内部

## 5. 视觉与交互设计

### 5.1 视觉对齐原则

- 以 `ui/login.pen` 中 `bi8Au` 主画布为主参考，采用浅色科技风。
- 保持“品牌信息区 + 登录卡片”双区信息结构。
- 注册与找回弹窗视觉语言与登录卡片统一。

### 5.2 必要交互规则

- 登录按钮在提交时显示加载态，防止重复提交。
- 登录失败信息在表单顶部可见，不清空已输入值。
- 注册/找回入口均从登录页主交互进入。
- 弹窗支持右上角关闭、取消按钮关闭、遮罩关闭。
- 弹窗关闭后重置表单，避免旧输入残留。

## 6. 异常与边界

- 登录接口报错：仅展示错误，不改变路由层处理逻辑。
- 弹窗校验失败：字段级错误提示，不做后端交互。
- 重复打开弹窗：始终展示干净表单状态（依赖重置策略）。
- 未覆盖的业务能力（注册真实开通、短信验证码发送）在本次明确留白。

## 7. 测试与验收策略

### 7.1 单测与组件测试重点

- 路由层：
  - 登录成功时正确调用 `setToken` 与跳转。
  - 登录失败时 `errorMessage` 能传递并展示。
- 组件层：
  - 登录表单必填校验。
  - 注册入口可打开注册弹窗。
  - 找回入口可打开找回弹窗。
  - 两个弹窗表单校验、关闭与重置行为正确。

### 7.2 验收标准

- 页面视觉和信息层级符合 `ui/login.pen`。
- 现有登录接口逻辑行为不变。
- 注册/找回弹窗交互可完整演示，且不调用后端。
- 相关测试通过，不影响其他路由页面。

## 8. 风险与限制

- 风险：画布与现有组件库细节存在差异时，可能出现轻微视觉偏差。
- 风险：若后续业务要求“真实注册/找回”，需独立需求与接口设计，不应在本次透支实现。
- 限制：本次不提供移动端适配，按项目约束仅面向桌面端布局。

## 9. 实施后续（下一阶段）

设计确认后进入实现计划阶段，输出分步骤实施计划（文件迁移、组件拆分、样式重建、测试补齐、回归验证）。
