# 登录页重构设计（基于 ui/login.pen）

## 1. 背景与目标

当前后台登录页已具备可用的登录接口链路，但视觉风格与 `ui/login.pen` 画布不一致，且注册/找回密码交互未按画布进行统一承载。本次设计目标是在**不改变现有登录接口逻辑**的前提下，完成登录页与两个弹窗的结构和视觉重构。

本次范围覆盖：

- `/login` 登录主页面（浅色科技风）
- 密码登录、QR 扫描登录两种方式，含过渡加载页
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
- 视觉风格严格对齐 `ui/login.pen`。
- 状态管理用 `useState`（页面级局部状态，不使用 Zustand）。
- 复杂动画样式用 styled-components。
- QR 轮询用 TanStack Query `useQuery` + `refetchInterval`。
- 登录失败用 `Modal.alert()` 强提示。

### 2.2 关键决策

- 采用“**路由逻辑不动，视图分层重组**”方案：
  - `Route` 层继续负责 mutation、token 与 redirect。
  - 页面层负责视觉编排和 panel 切换调度。
  - 子组件只处理各自的表单/展示逻辑。
- Canvas 切换采用**按需挂载 + CSS 过渡动画**：
  - 只有当前活跃 panel 存在于 DOM 中。
  - 通过 CSS `transition: opacity` + `onTransitionEnd` 控制淡出→卸载→挂载→淡入。
  - 不引入额外动画库。

## 3. 目标结构设计

### 3.1 文件组织

```
admin-rsbuild/src/routes/login/
  index.tsx                    # 路由入口（导出 Route）
  #Login-Background.tsx        # 背景包装层（sidebar 动画 + 动画容器 + children slot）
  #Login-Password.tsx          # 密码登录 panel
  #Login-QRScan.tsx            # QR 扫描登录 panel
  #Login-Skeleton.tsx          # 过渡骨架屏 panel
  #Login-NeonAnimation.tsx     # 霓虹灯动画包装层
  #Login-RegisterModal.tsx     # 注册弹窗（展示级，不接后端）
  #Login-ForgotModal.tsx       # 找回密码弹窗（展示级，不接后端）
  #styles.tsx                  # styled-components 动画样式
```

说明：

- `index.tsx` 作为路由文件，使用 `createFileRoute('/login')` 导出 `Route`。
- `#` 前缀文件作为页面私有实现，避免被路由扫描器误识别。
- 所有文件集中在一个目录，职责语义清晰。

### 3.2 组件职责边界

| 组件 | 职责 | 依赖 |
|---|---|---|
| `index.tsx` | 路由入口，管理 `useMutation`、token、redirect，状态调度，panel 切换 | 所有 #Login-* 组件 |
| `#Login-Background.tsx` | 渲染左侧 sidebar 动画 + 右侧动画容器 + 通过 `children` slot 插入当前 panel | `#Login-NeonAnimation` |
| `#Login-Password.tsx` | 密码登录表单，触发登录 mutation，提供注册/找回弹窗入口 | K-BrandLogo、Ant Form、useMutation |
| `#Login-QRScan.tsx` | QR 码展示 + useQuery 轮询扫描状态 | K-BrandLogo、useQuery |
| `#Login-Skeleton.tsx` | 骨架屏，模拟密码表单布局，用于过渡加载 | Ant Skeleton |
| `#Login-NeonAnimation.tsx` | 左侧栏三组错开 delay 的宽幅动画条 | `#styles.tsx` styled-components |
| `#Login-RegisterModal.tsx` | 注册弹窗，仅前端校验、提示、关闭与重置 | Ant Form、Ant Modal |
| `#Login-ForgotModal.tsx` | 找回密码弹窗，仅前端校验、提示、关闭与重置 | Ant Form、Ant Modal |

## 4. Canvas 切换机制

### 4.1 状态定义

```ts
// 当前显示的面板
const [activePanel, setActivePanel] = useState<'password' | 'qrScan' | 'skeleton'>('skeleton')
// 过渡状态
const [transitionState, setTransitionState] = useState<'idle' | 'exiting' | 'entering'>('idle')
```

### 4.2 切换流程

1. 调用 `switchTo('qrScan')` → `setTransitionState('exiting')`
2. CSS 淡出动画（`opacity: 1 → 0`，duration ~300ms）
3. `onTransitionEnd` 回调 → 更新 `activePanel`、`setTransitionState('entering')`
4. 新 panel 挂载，CSS 淡入（`opacity: 0 → 1`）
5. `onTransitionEnd` → `setTransitionState('idle')`

### 4.3 防抖处理

- `transitionState !== 'idle'` 时忽略新的切换请求，防止快速连续切换导致动画冲突。

## 5. 数据流与状态设计

### 5.1 登录主链路（保持不变）

1. 用户在登录卡片输入 `username/password` 并提交。
2. `index.tsx` 调用 `ApiPassport.passwordLogin`。
3. 成功：写入 token，跳转到 `redirect` 或默认首页。
4. 失败：`Modal.alert()` 强提示错误信息。

### 5.2 QR 扫描链路

1. 用户切换到 QR 扫描 panel。
2. `#Login-QRScan.tsx` 调用后端获取 QR 码。
3. `useQuery` + `refetchInterval` 轮询扫描状态。
4. 扫描成功 → `onSwitch('skeleton')` → 过渡 → 跳转首页。
5. 超时（如 60s）→ 显示"二维码已过期"，点击重新生成。

### 5.3 弹窗链路（展示级）

- 注册弹窗：
  - 打开后录入字段 → 本地规则校验 → 成功提示/关闭 → 表单重置。
- 找回弹窗：
  - 打开后录入字段 → 本地规则校验 → 成功提示/关闭 → 表单重置。

### 5.4 状态归属

- `loading/errorMessage`：路由层（来自 mutation）
- `activePanel/transitionState`：页面层（`index.tsx`）
- `registerOpen/forgotPasswordOpen`：页面层（`index.tsx`）
- 表单字段与即时校验状态：各 panel 组件内部
- QR 轮询状态：`#Login-QRScan.tsx` 内部（useQuery 自管理）

### 5.5 数据流图

```
index.tsx (Route)
  ├── useMutation(ApiPassport.passwordLogin)
  │   ├── loading/errorMessage → 透传给子组件
  │   ├── success → setToken + navigate
  │   └── failure → Modal.alert()
  │
  ├── registerOpen / forgotOpen (useState)
  │   ├── #Login-RegisterModal
  │   └── #Login-ForgotPasswordModal
  │
  └── activePanel / transitionState (useState)
      │
      ├── #Login-Background (children slot)
      │   ├── #Login-NeonAnimation (左侧动画)
      │   └── children = 当前 panel
      │       ├── #Login-Password → onSwitch / onSubmit / 打开弹窗
      │       ├── #Login-QRScan  → onSwitch / useQuery
      │       └── #Login-Skeleton → (纯展示)
```

## 6. 视觉与交互设计

### 6.1 视觉对齐原则

- 以 `ui/login.pen` 中主画布为主参考，采用浅色科技风。
- 保持"品牌信息区 + 登录卡片"双区信息结构。
- 注册与找回弹窗视觉语言与登录卡片统一。

### 6.2 必要交互规则

- 登录按钮在提交时显示加载态，防止重复提交。
- 登录失败用 `Modal.alert()` 强提示。
- 注册/找回入口均从登录页主交互进入。
- 弹窗支持右上角关闭、取消按钮关闭、遮罩关闭。
- 弹窗关闭后重置表单，避免旧输入残留。
- 页面首次加载：默认显示 skeleton → 加载完成后切换到 password，给用户流畅的"页面就绪"感。

## 7. 异常与边界

| 场景 | 处理方式 |
|---|---|
| QR 轮询超时（如 60s 无响应） | `useQuery` 设置 `retry: 0` + 自定义超时逻辑，超时后显示"二维码已过期"，点击重新生成 |
| 网络断开 | `useQuery` 的 `isError` 状态，显示重试按钮 |
| 过渡动画中断（快速连续切换） | `transitionState !== 'idle'` 时忽略新的切换请求，防抖处理 |
| 首次加载 | 页面默认显示 skeleton → 加载完成后切换到 password |
| 登录失败 | `Modal.alert()` 强提示，停留在当前 panel |
| 页面刷新 | 恢复到 password panel（不需要持久化状态） |
| 弹窗校验失败 | 字段级错误提示，不做后端交互 |
| 重复打开弹窗 | 始终展示干净表单状态（依赖重置策略） |

## 8. 测试与验收策略

### 8.1 单测与组件测试重点

- 路由层：
  - 登录成功时正确调用 `setToken` 与跳转。
  - 登录失败时 `Modal.alert()` 被调用。
- 组件层：
  - 登录表单必填校验。
  - 注册入口可打开注册弹窗。
  - 找回入口可打开找回弹窗。
  - 两个弹窗表单校验、关闭与重置行为正确。
- Panel 切换：
  - 默认显示 skeleton → 自动切换到 password。
  - 密码 ↔ QR 切换动画正常触发与结束。
  - 快速切换时防抖生效。

### 8.2 验收标准

- 页面视觉和信息层级符合 `ui/login.pen`。
- 现有登录接口逻辑行为不变。
- 注册/找回弹窗交互可完整演示，且不调用后端。
- QR 扫描登录可完整演示（含轮询、超时、重新生成）。
- 相关测试通过，不影响其他路由页面。

## 9. 风险与限制

- 风险：画布与现有组件库细节存在差异时，可能出现轻微视觉偏差。
- 风险：若后续业务要求"真实注册/找回"，需独立需求与接口设计，不应在本次透支实现。
- 限制：本次不提供移动端适配，按项目约束仅面向桌面端布局。

## 10. 实施后续（下一阶段）

设计确认后进入实现计划阶段，输出分步骤实施计划（文件迁移、组件拆分、样式重建、测试补齐、回归验证）。
