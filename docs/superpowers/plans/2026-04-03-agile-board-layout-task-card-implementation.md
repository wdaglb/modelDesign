# 敏捷面板重布局与任务卡片通用化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改后端接口的前提下，完成敏捷面板主布局重排、任务卡片下沉到 `components/business`、并保持任务详情抽屉与新建任务 Markdown 编辑能力不回归。

**Architecture:** 页面继续由 `agile-board.tsx` 负责查询与业务编排；任务卡片拆成“通用展示层 + 看板拖拽包装层”，用适配器隔离页面实体与通用视图模型。设计稿改动聚焦 `design:mianban.pen` 主画布，页面主体维持看板，详情继续抽屉承载，不引入常驻右栏。

**Tech Stack:** React 18、TypeScript、Ant Design、TanStack Query、dnd-kit、Pencil `.pen` 画布

---

> 说明：仓库 `AGENTS.md` 约束“无需执行命令验证”，本计划以代码落地步骤与静态核查为主，不把运行测试命令作为必做步骤。

## 文件结构与职责

### 新增文件

- `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
  - 任务卡片通用模型与动作契约定义。

- `admin-rsbuild/src/components/business/task-card/TaskCardPriorityTag.tsx`
  - 任务优先级标签与下拉切换交互。

- `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
  - 任务卡片通用展示组件（不含拖拽）。

- `admin-rsbuild/src/components/business/task-card/index.ts`
  - 任务卡片对外导出入口。

- `admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts`
  - 将 `AgileBoardTask` 映射为 `TaskCardModel`。

- `admin-rsbuild/src/routes/agile-board/#AgileBoardTaskCard.tsx`
  - 看板场景拖拽包装器与拖拽预览卡片。

### 修改文件

- `admin-rsbuild/src/components/index.ts`
  - 导出通用任务卡片组件。

- `admin-rsbuild/src/routes/agile-board/#BoardColumn.tsx`
  - 从旧 `#BoardCard` 切换到新包装器。

- `admin-rsbuild/src/routes/agile-board.tsx`
  - 调整拖拽浮层组件引用与页面布局样式结构。

- `admin-rsbuild/src/routes/agile-board/#BoardCard.tsx`
  - 收敛为兼容层（可选）或下线替换（按实施时选择其一）。

- `design:mianban.pen`
  - 按更新设计稿重排敏捷面板主画布，强化“主体看板 + 抽屉详情”表达。

### 只读核查文件（不改）

- `admin-rsbuild/src/service/taskModalService.tsx`
- `admin-rsbuild/src/routes/project/components/#TaskCreateForm.tsx`

核查目标：确认“任务详情”输入区仍为 `KMarkdownEditor`。

## Task 1: 画布重排并固化页面信息结构

**Files:**
- Modify: `design:mianban.pen`

- [ ] Step 1: 在 `bi8Au` 主画布设置占位编辑态，锁定“顶部工具栏 + 看板主体”两段结构。
- [ ] Step 2: 重排 `header` 与 `scrollWrap/leftZone`，确保看板列区域为页面唯一主体内容区。
- [ ] Step 3: 去除主页面常驻右侧详情区表达，保留抽屉工作区在 `drawerWorkRoot` 作为参考组件稿。
- [ ] Step 4: 在画布中标注“任务详情通过抽屉打开”的交互路径，避免误实现为常驻侧栏。
- [ ] Step 5: 对 `modalWorkRoot` 的“新建任务弹窗”补充约束注记：任务详情区域使用 Markdown 编辑器语义。
- [ ] Step 6: 解除主画布占位编辑态并完成截图核查一次。
- [ ] Step 7: 提交一次“敏捷面板画布重排”变更。

## Task 2: 抽离通用任务卡片基础模块

**Files:**
- Create: `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
- Create: `admin-rsbuild/src/components/business/task-card/TaskCardPriorityTag.tsx`
- Create: `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
- Create: `admin-rsbuild/src/components/business/task-card/index.ts`
- Modify: `admin-rsbuild/src/components/index.ts`

- [ ] Step 1: 在 `TaskCard.types.ts` 定义 `TaskCardModel`、`TaskCardActions`、`TaskCardRenderOptions`，字段覆盖标题、项目、负责人、工时、截止、优先级。
- [ ] Step 2: 在 `TaskCardPriorityTag.tsx` 实现优先级标签与下拉菜单，保留点击事件冒泡阻断能力。
- [ ] Step 3: 在 `TaskCard.tsx` 实现通用卡片主体，内置预览点击与优先级切换，不引入任何拖拽依赖。
- [ ] Step 4: 在 `TaskCard.tsx` 为关键交互块补充 `/** */` 注释，说明“优先级触发区不触发预览”的约束。
- [ ] Step 5: 在 `task-card/index.ts` 与 `components/index.ts` 补齐导出，保证其它业务页可直接复用。
- [ ] Step 6: 静态核查新增文件：无三元表达式、注释格式符合 `/** */` 约束。
- [ ] Step 7: 提交一次“通用任务卡片基础能力”变更。

## Task 3: 实现看板场景包装层与数据适配层

**Files:**
- Create: `admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts`
- Create: `admin-rsbuild/src/routes/agile-board/#AgileBoardTaskCard.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#BoardColumn.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#BoardCard.tsx`

- [ ] Step 1: 在 `#taskCardAdapter.ts` 实现 `mapAgileBoardTaskToCardModel(task)`，统一默认文案策略（未分配负责人、未命名项目、未设置截止时间）。
- [ ] Step 2: 在 `#AgileBoardTaskCard.tsx` 接入 `useDraggable`，仅包装拖拽状态与监听器，再渲染通用 `TaskCard`。
- [ ] Step 3: 在包装器中提供 `AgileBoardTaskCardPreview`，用于 `DragOverlay` 浮层展示。
- [ ] Step 4: 修改 `#BoardColumn.tsx`，将卡片渲染由旧 `AgileBoardCard` 替换为新 `AgileBoardTaskCard`。
- [ ] Step 5: 处理 `#BoardCard.tsx`：保留兼容导出并内部转调新包装器，或删除并更新全部引用（二选一后固定方案）。
- [ ] Step 6: 静态核查卡片点击链路，确认优先级操作区不会触发预览回调。
- [ ] Step 7: 提交一次“看板包装层 + 适配层”变更。

## Task 4: 页面布局接线与视觉收口

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#BoardToolbar.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#BoardColumn.tsx`

- [ ] Step 1: 在 `agile-board.tsx` 替换拖拽浮层引用为新 `AgileBoardTaskCardPreview`。
- [ ] Step 2: 根据新设计稿微调页面容器与看板容器样式，确保主体是看板列区且无常驻右栏。
- [ ] Step 3: 收口工具栏与列容器间距、背景与圆角层级，保证与 `design:mianban.pen` 视觉语言一致。
- [ ] Step 4: 保持现有筛选、拖拽换状态、优先级更新、缓存失效逻辑不变，不改请求参数与接口地址。
- [ ] Step 5: 静态核查 `useBoardAutoRefresh` 使用点，确认暂停条件未回归。
- [ ] Step 6: 提交一次“页面布局接线与样式收口”变更。

## Task 5: 保证抽屉详情与 Markdown 弹窗能力不回归

**Files:**
- Review only: `admin-rsbuild/src/routes/agile-board/#previewDrawerService.ts`
- Review only: `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
- Review only: `admin-rsbuild/src/service/taskModalService.tsx`
- Review only: `admin-rsbuild/src/routes/project/components/#TaskCreateForm.tsx`

- [ ] Step 1: 静态核查任务卡片点击后调用链仍为 `openTaskPreviewDrawer`，详情继续由 `KDrawer` 承载。
- [ ] Step 2: 静态核查新建任务入口仍经 `openTaskModal`，未引入新弹窗实现分叉。
- [ ] Step 3: 静态核查 `TaskCreateForm` 中 `description` 字段组件仍是 `KMarkdownEditor`。
- [ ] Step 4: 如需要补充注释，仅新增 `/** */` 约束注释，不调整表单字段结构与提交格式。
- [ ] Step 5: 输出一段回归检查记录，明确“抽屉详情 + Markdown 编辑器”均保持不变。
- [ ] Step 6: 提交一次“关键交互回归保护”变更。

## Task 6: 交付收口与变更说明

**Files:**
- Modify: `docs/superpowers/specs/2026-04-03-agile-board-layout-task-card-design.md`（仅在实现偏差时回写）
- Review only: 本轮所有改动文件

- [ ] Step 1: 对照 spec 逐条核查：主体看板、抽屉详情、卡片通用化、接口不改、Markdown 保留。
- [ ] Step 2: 扫描代码约束：注释使用 `/** */`，无三元表达式，单文件若超 400 行则计划拆分。
- [ ] Step 3: 生成交付摘要，列出改动文件、关键行为和未覆盖项。
- [ ] Step 4: 整理提交记录，保证每次提交都可独立回滚。

## Spec 覆盖映射

- 页面主体看板（无常驻右栏）：Task 1、Task 4
- 任务详情抽屉承载：Task 1、Task 5
- 任务卡片抽到 `components/business`：Task 2、Task 3
- 交互边界（预览/优先级内置，拖拽外置）：Task 2、Task 3、Task 4
- 后端接口零改动：Task 4、Task 5
- 新建任务保留 Markdown 编辑器：Task 1、Task 5

## 计划自检

- 已完成占位词检查：无 `TODO`、`TBD`、`后续补充` 占位文本。
- 已完成一致性检查：统一使用 `TaskCardModel`、`AgileBoardTaskCard`、`KMarkdownEditor` 命名。
- 已完成范围检查：仅前端与画布，不包含后端实现任务。
