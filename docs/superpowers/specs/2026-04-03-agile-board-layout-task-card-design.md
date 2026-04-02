# 敏捷面板重布局与任务卡片通用化设计（不改后端接口）

## 1. 目标与结论

### 1.1 目标
- 使用 Pencil 依据最新设计稿重排敏捷面板主页面布局。
- 把任务卡片抽象为可复用业务组件，先沉淀到 `components/business`。
- 保持后端接口和请求协议不变。

### 1.2 已确认结论
- 页面主体是看板本身，不做“左看板 + 右常驻详情区”布局。
- 任务详情继续通过抽屉展示（`KDrawer`）。
- 新增任务弹窗中的“任务详情”输入框必须保留现有 `KMarkdownEditor`，不能降级为普通文本框。
- 通用任务卡片采用“内置常用交互 + 场景外置拖拽”策略：卡片内置预览点击与优先级切换，拖拽能力保留在看板场景包装层。

## 2. 范围与非目标

### 2.1 本次范围
- `agile-board` 页面结构重排与视觉层级优化。
- 任务卡片从页面私有组件抽离到 `components/business`。
- 看板页面接入新通用卡片并保留原有业务行为。

### 2.2 非目标
- 不新增后端接口，不修改现有接口字段。
- 不改动任务详情抽屉的业务能力边界，只做接入与样式一致性对齐。
- 不替换任务新建/编辑表单里的 Markdown 编辑器。

## 3. 现状摘要

## 3.1 现有页面结构
- 页面入口在 `admin-rsbuild/src/routes/agile-board.tsx`。
- 当前由 `#BoardToolbar`、`#BoardColumn`、`#BoardCard` 组装。
- 页面包含：筛选、拖拽换状态、优先级快捷调整、任务预览抽屉、新建/编辑弹窗、自动刷新暂停机制。

### 3.2 现有痛点
- `#BoardCard.tsx` 绑定了页面场景细节（拖拽、交互、展示），跨页面复用成本高。
- 卡片样式与行为难以在“我的待办/任务列表”等页面直接复用。
- 设计稿已更新，需要页面主布局与组件边界同步升级。

## 4. 总体方案（方案 A）

## 4.1 核心思路
- 抽出通用 `TaskCard` 业务组件，统一卡片信息结构与常用交互。
- 在 `agile-board` 保留一个场景包装器 `AgileBoardTaskCard`，仅负责 `dnd-kit` 拖拽接入与看板场景特有约束。
- 页面整体布局按“顶部工具栏 + 全宽看板列区域”重排，详情通过抽屉打开，不做常驻右侧栏。

### 4.2 方案价值
- 降低看板页面耦合度，后续页面复用只需新增适配器。
- 拖拽逻辑不污染通用组件，避免未来非拖拽页面背负额外复杂度。
- 保持接口与业务流程稳定，减少联动风险。

## 5. 组件与目录设计

### 5.1 新增/调整目录
- `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
- `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
- `admin-rsbuild/src/components/business/task-card/TaskCardPriorityTag.tsx`
- `admin-rsbuild/src/components/business/task-card/index.ts`
- `admin-rsbuild/src/routes/agile-board/#AgileBoardTaskCard.tsx`
- `admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts`

### 5.2 职责划分
- `TaskCard`：
  - 负责卡片信息展示（项目、标题、工时、负责人、截止时间、优先级）。
  - 负责预览点击事件和优先级切换事件触发。
  - 不包含拖拽 ID、拖拽监听器、拖拽样式语义。
- `TaskCardPriorityTag`：
  - 负责优先级标签 UI 与下拉交互，降低 `TaskCard` 主体复杂度。
- `AgileBoardTaskCard`：
  - 负责接入 `useDraggable` 与看板拖拽态表现。
  - 负责将 `AgileBoardTask` 适配并传入通用 `TaskCard`。
- `taskCardAdapter`：
  - 把看板任务实体映射为通用卡片视图模型，隔离字段差异和默认文案策略。

## 6. 数据模型与数据流

### 6.1 通用卡片视图模型（建议）
```ts
interface TaskCardModel {
  taskId: number;
  title: string;
  projectText: string;
  assigneeText: string;
  dueTimeText: string;
  workDaysText: string;
  priority: TaskPriority;
}
```

### 6.2 通用卡片动作契约（建议）
```ts
interface TaskCardActions {
  onPreview?: (taskId: number) => Promise<void>;
  onPriorityChange?: (taskId: number, priority: TaskPriority) => Promise<void>;
}
```

### 6.3 页面数据流
1. `agile-board.tsx` 继续查询 `ApiProjectTask.getAgileBoard(params)` 与状态配置。
2. 分组逻辑继续复用 `groupBoardTasks`。
3. 每个任务通过 `taskCardAdapter` 转成 `TaskCardModel`。
4. `AgileBoardTaskCard` 组合拖拽能力并渲染通用 `TaskCard`。
5. 点击预览继续走 `openTaskPreviewDrawer`；优先级修改继续走 `ApiProjectTask.edit` 与 `buildBoardEditPayload`。

## 7. 交互与行为约束

### 7.1 页面主交互
- 拖拽到状态列：行为不变，更新状态后刷新看板、任务列表、我的待办缓存。
- 点击卡片（非优先级触发区）：打开任务详情抽屉。
- 优先级切换：调用现有编辑接口，成功后提示并刷新。
- 自动刷新：保持“拖拽中 / 抽屉开启 / 表单开启时暂停”的现有规则。

### 7.2 弹窗与抽屉约束
- 新建/编辑任务仍统一经 `openTaskModal` 打开。
- `TaskCreateForm` 中 `description` 字段继续使用 `KMarkdownEditor`。
- 任务详情维持抽屉承载，不新增页面右侧常驻详情区。

## 8. Pencil 重布局设计

### 8.1 页面构成
- 顶部：页面标题与筛选工具栏。
- 主体：全宽横向看板列容器，列内包含列头、数量、空态、卡片列表。
- 详情：抽屉层展示，不占主画布常驻布局空间。

### 8.2 与当前画布的对齐原则
- `bi8Au` 作为主页面工作区继续使用。
- 主画布重点优化 `header` 与 `leftZone`（看板主体）结构节奏。
- `drawerWorkRoot` 与 `modalWorkRoot` 作为详情抽屉与新建弹窗设计参考区，可保留为组件稿，不合并为主页面常驻区域。
- 对“新建任务弹窗”设计稿进行约束标注：任务详情区域必须对应 Markdown 编辑器形态。

## 9. 实施步骤（编码阶段）

1. 先创建通用 `TaskCard` 及相关类型、子组件，并补充导出。
2. 新建 `#taskCardAdapter.ts`，建立看板任务到通用模型的映射。
3. 新建 `#AgileBoardTaskCard.tsx` 承接拖拽逻辑，替换 `#BoardCard.tsx` 在列组件中的直接使用。
4. 保持 `agile-board.tsx` 的查询、抽屉、自动刷新与更新逻辑不变，仅调整组件引用。
5. 按更新后的设计稿对页面布局样式做等价重排，不引入无关业务改动。
6. 校验新建任务弹窗设计与实现约束一致：`description` 继续使用 `KMarkdownEditor`。

## 10. 风险与回滚

### 10.1 主要风险
- 卡片抽象过度导致场景定制困难。
- 适配层字段映射遗漏，造成展示文案回退异常。
- 看板拖拽与卡片点击区域冲突。

### 10.2 控制策略
- 严格控制通用组件边界：只收敛共性，不吸收拖拽语义。
- 通过适配器集中处理默认文案，避免散落判断。
- 复用现有优先级触发区事件阻断逻辑，避免点击误触预览。

### 10.3 回滚思路
- 保留原 `#BoardCard.tsx` 在迁移期可快速切回。
- 若抽象影响线上稳定，先回退为页面私有组件，再逐步拆分子能力。

## 11. 验证策略

- 组件层：
  - 卡片信息展示完整性（标题、项目、负责人、工时、截止时间、优先级）。
  - 优先级切换入口交互正确性。
- 页面层：
  - 拖拽换列成功、提示正常、列表刷新正常。
  - 卡片点击打开抽屉，优先级触发区不误开抽屉。
  - 筛选与重置行为不回归。
- 弹窗层：
  - 新建任务“任务详情”区域继续是 `KMarkdownEditor`，支持 Markdown 与图片粘贴上传能力。

## 12. 验收标准

- 看板页面完成新版布局，且主体仍为看板列区域。
- 任务详情通过抽屉展示，未引入常驻右侧详情区。
- 任务卡片已抽到 `components/business`，看板使用包装器接入拖拽。
- 后端接口零改动，现有查询与更新链路保持可用。
- 新建任务弹窗保留 Markdown 编辑器能力。
