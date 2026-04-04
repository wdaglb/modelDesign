# Agile Board 目录统一与样式重设计方案

## 1. 目标与结论

### 1.1 目标
- 将 `admin-rsbuild/src/routes/agile-board.tsx` 统一迁入 `agile-board/` 目录，消除“同名入口文件 + 同名目录并存”的结构。
- 按职责重组 `agile-board` 页面私有代码，并避免被 TanStack Router 误扫描。
- 使用 `styled-components` 重构敏捷面板页面与当前依赖的通用任务卡片样式。
- 保持现有敏捷看板主交互不变，同时补齐任务编号直达、一级子任务内嵌展示、空列说明等能力。

### 1.2 已确认结论
- 路由入口采用 `index.tsx + #私有目录` 形式。
- 视觉方向为保守升级，不改变现有业务气质和主交互结构。
- 卡片左上角任务编号采用链接式视觉，点击可直接复制。
- 父任务卡片下方展示一级子任务，左缩进呈现，字段内容与普通任务保持一致。
- 任务列无数据时明确展示 `Empty` 说明。
- 搜索框支持“标题或任务编号”双语义：若输入像任务编号，则先查编号详情，失败后回退到标题搜索。
- 前端不改现有主链路接口语义；后端补充批量子任务查询与按编号查询详情能力。

## 2. 范围与非目标

### 2.1 本次范围
- `agile-board` 路由目录重组。
- 页面私有组件、工具函数、服务、样式的职责归档。
- `styled-components` 化页面壳层、工具栏、列容器、空态区、父子任务层级区。
- `components/business/task-card` 的样式和交互增强。
- 后端新增：
  - 批量查询父任务子任务接口
  - 按任务编号查询任务详情接口

### 2.2 非目标
- 不改动现有拖拽、优先级切换、详情抽屉、新建/编辑弹窗的业务边界。
- 不将子任务做成多级递归树结构。
- 不修改现有主接口 `/project/task/agile-board`、`/project/task/detail`、`/project/task/edit` 的协议含义。
- 不引入新的前端状态管理方案。

## 3. 现状摘要

### 3.1 当前结构问题
- 页面入口位于 `admin-rsbuild/src/routes/agile-board.tsx`，同时存在 `admin-rsbuild/src/routes/agile-board/` 目录。
- 当前页面下虽然已有私有文件拆分，但仍以 `#BoardToolbar`、`#BoardColumn`、`#helper` 这类平铺文件为主，缺少更清晰的职责边界。
- 页面和通用卡片中存在较多 inline style，样式复用与维护成本偏高。

### 3.2 当前能力基础
- 看板已有完整主流程：筛选、拖拽换状态、优先级切换、详情抽屉、新建/编辑、自动刷新暂停。
- 通用卡片已具备任务编号展示与复制能力雏形。
- 任务详情抽屉已有子任务查询能力，说明后端现有 `/project/task/children` 已可复用。
- 现有任务详情模型已包含 `parentTaskId` 字段，可支撑前端按父任务归组子任务。

## 4. 路由与目录设计

### 4.1 目录结构
```text
admin-rsbuild/src/routes/agile-board/
├── index.tsx
├── #components/
│   ├── AgileBoardTaskCard.tsx
│   ├── BoardColumn.tsx
│   ├── BoardToolbar.tsx
│   ├── TaskChangeLogPanel.tsx
│   ├── TaskPreviewDrawer.tsx
│   ├── TaskPreviewSection.tsx
│   ├── TaskPreviewSummary.tsx
│   └── TaskSubtaskPanel.tsx
├── #hooks/
│   └── useBoardAutoRefresh.ts
├── #services/
│   └── previewDrawerService.tsx
├── #utils/
│   ├── helper.ts
│   ├── taskCardAdapter.ts
│   └── types.ts
└── #styles/
    ├── board.styled.tsx
    ├── column.styled.tsx
    ├── task-card-shell.styled.tsx
    └── toolbar.styled.tsx
```

### 4.2 采用 `#私有目录` 的原因
- 当前 `rsbuild.config.ts` 中 TanStack Router 已配置 `routeFileIgnorePrefix: '#'`。
- 普通目录名如 `hooks`、`styles`、`utils` 当前不在全局忽略列表中，直接使用会增加误扫描风险。
- 沿用 `login` 页面当前的 `#私有文件` 约定，更符合现有项目风格，且无需额外修改全局路由扫描配置。

### 4.3 职责划分
- `index.tsx`：页面组装、查询、拖拽事件、抽屉/弹窗调度。
- `#components/`：仅放 UI 组件，不承载主查询逻辑。
- `#hooks/`：放页面行为型 hook，如自动刷新暂停控制。
- `#services/`：放抽屉打开等副作用型服务。
- `#utils/`：放纯函数、适配器、类型。
- `#styles/`：收口页面私有 `styled-components`。

## 5. 页面与样式设计

### 5.1 视觉方向
- 保持当前业务工作台气质，不做强视觉风格漂移。
- 页面底色采用浅灰蓝工作区背景。
- 顶部标题区与筛选区面板化，增强层级但不过度装饰。
- 列容器保留状态色识别，仅通过边框、标题色、数量徽标做区分。
- 父任务卡片是视觉主体，子任务卡片更轻、更紧凑。

### 5.2 样式组织

#### 页面私有样式
- 放于 `agile-board/#styles/`。
- 负责页面根容器、头部摘要、筛选面板、列容器、空列、子任务缩进区。

#### 通用卡片样式
- 放于 `admin-rsbuild/src/components/business/task-card/`。
- 负责卡片头部、标题区、元信息区、任务编号链接态、子任务紧凑态。

### 5.3 任务编号表现
- 位于卡片左上角。
- 采用链接式视觉：
  - 等宽字体
  - 明确下划线
  - hover 时强化颜色与下划线反馈
  - 点击后复制并弹出轻量成功提示
- 点击编号时阻断卡片主体点击，避免误开详情抽屉。

### 5.4 空态设计
- 状态列无任务时，展示明确 `Empty` 说明，不再仅保留空容器。
- 父任务下无子任务时，也展示独立空态文案。
- 子任务加载失败时，仅在当前父任务卡片下展示轻量错误提示，不影响整列渲染。

## 6. 数据模型与交互设计

### 6.1 卡片视图模型
建议在前端适配层统一父任务与子任务的视图结构：

```ts
interface AgileBoardTaskCardModel {
  id: number;
  taskNumber: string;
  title: string;
  projectName?: string;
  priority: TaskPriority;
  workDays?: number;
  assignee?: string;
  dueTime?: string;
  isSubtask?: boolean;
  parentTaskId?: number;
  subtasks?: AgileBoardTaskCardModel[];
}
```

约束：
- 父任务 `isSubtask = false`
- 子任务 `isSubtask = true`
- 本次只允许一级子任务，所以仅父任务持有 `subtasks`

### 6.2 看板主数据流
1. 页面继续调用 `/project/task/agile-board` 获取看板父任务列表。
2. 提取当前父任务 `id` 集合。
3. 调用批量子任务接口一次性获取所有一级子任务。
4. 前端按 `parentTaskId` 分组。
5. 使用适配器统一映射父任务与子任务卡片模型。
6. 渲染时在父任务卡片下方左缩进展示子任务。

### 6.3 子任务展示规则
- 只展示一级子任务，不递归渲染。
- 子任务内容字段与父任务卡片保持一致：
  - 任务编号
  - 标题
  - 优先级
  - 工时
  - 负责人
  - 截止时间
- 子任务卡片不改变主交互语义，仍可打开详情。

### 6.4 搜索框行为升级
- 搜索框 placeholder 调整为“搜索任务标题或编号”。
- 搜索时按以下顺序处理：
  1. 判断输入内容是否像任务编号。
  2. 若像任务编号，则优先调用“按编号查询任务详情”接口。
  3. 若查到任务，则直接打开详情抽屉，不改当前看板筛选结果。
  4. 若未查到，则自动回退为标题搜索，维持现有筛选逻辑。
  5. 若输入明显只是普通标题，则直接走标题搜索。

## 7. 后端接口扩展设计

### 7.1 批量查询子任务接口
建议新增：

```java
@Operation(summary = "批量获取子任务列表")
@GetMapping("/children/batch")
public List<ProjectTaskDetailVo> childrenBatch(
    @Parameter(description = "父任务 ID 列表", required = true)
    @RequestParam List<Long> parentTaskIds
) {
    return projectTaskService.getChildrenBatch(parentTaskIds);
}
```

设计说明：
- 返回平铺数组，前端按 `parentTaskId` 归组。
- 返回结构复用 `ProjectTaskDetailVo`，不新增额外 VO。
- 兼容多父任务批量装配场景，适合当前 `agile-board` 页面。

### 7.2 按任务编号查询详情接口
建议新增：

```java
@Operation(summary = "按任务编号获取任务详情")
@GetMapping("/detail/by-code")
public ProjectTaskDetailVo detailByCode(
    @Parameter(description = "任务编号", required = true)
    @RequestParam @NotBlank(message = "任务编号不能为空") String code
) {
    return projectTaskService.getDetailByCode(code);
}
```

设计说明：
- 用于搜索框的“编号直达详情”能力。
- 后端统一做任务编号解析，兼容当前前端编号展示所覆盖的 `taskCode`、`taskNo`、`code`、`serialNumber` 等来源。
- 若当前系统中部分任务展示编号回退为 `id`，后端也应保证可按可见编号命中，以避免前端显示与查询规则不一致。

### 7.3 约束
- 保持租户隔离逻辑不变。
- Swagger 注解必须补齐。
- 不破坏现有 `/detail`、`/children`、`/agile-board` 语义。

## 8. 实施建议

### 8.1 前端实施顺序
1. 将 `agile-board.tsx` 迁移为 `agile-board/index.tsx`。
2. 按 `#components / #hooks / #services / #utils / #styles` 重组私有文件。
3. 引入页面私有 `styled-components`，逐步替换 inline style。
4. 升级通用 `TaskCard` 样式结构，补齐父任务/子任务视觉态。
5. 新增批量子任务前端请求封装与查询键。
6. 完成父任务下一级子任务挂载逻辑。
7. 升级搜索框逻辑，接入编号直达详情能力。
8. 校验拖拽、详情抽屉、优先级、筛选与空态行为。

### 8.2 后端实施顺序
1. 新增批量子任务查询接口与服务方法。
2. 新增按编号查询详情接口与服务方法。
3. 补齐 Swagger 注解与参数校验。
4. 验证租户隔离、空结果、非法编号、重复编号冲突处理策略。

## 9. 验证策略

### 9.1 前端验证
- 页面加载后能正确展示父任务与一级子任务。
- 子任务左缩进呈现，视觉弱于父任务但字段完整。
- 点击任务编号能够复制，且不会误开详情抽屉。
- 输入任务编号时可直接打开详情抽屉。
- 编号未命中时自动回退为标题搜索。
- 空列正确展示 `Empty` 说明。
- 拖拽、优先级切换、详情抽屉、新建任务不回归。

### 9.2 后端验证
- `/children/batch` 可在多父任务条件下返回正确结果，并保留 `parentTaskId`。
- `/detail/by-code` 可正确命中任务详情，未命中时返回明确错误。
- 租户隔离正确，不可跨租户命中任务。
- 编号查询性能可接受，不引入明显查询放大。

## 10. 风险与控制

### 10.1 主要风险
- 任务编号“显示规则”和“查询规则”不一致，导致用户看到能复制的编号却查不到。
- 父任务较多时，批量子任务返回量增大，影响前端渲染与接口性能。
- 子任务卡片过重，抢占父任务视觉重心。

### 10.2 控制策略
- 统一由后端定义编号解析规则，前端显示与查询使用同一套编号语义。
- 子任务仅限一级，避免渲染层级无限扩大。
- 子任务卡片使用更轻的边框、背景和尺寸节奏，确保主次清晰。
- 前端主页面保持“1 次看板请求 + 1 次批量子任务请求”的节奏，避免 fan-out 查询。

## 11. 验收标准
- `agile-board` 页面入口已统一迁入目录，且未触发 TanStack Router 误扫描。
- 页面与通用任务卡片的样式已迁移到 `styled-components` 体系。
- 左上角任务编号以链接式呈现，支持点击复制。
- 父任务卡片下可展示一级子任务，且左缩进、内容一致。
- 状态列无数据时展示明确 `Empty` 说明。
- 搜索框支持“编号直达详情，失败回退标题搜索”。
- 后端新增批量子任务查询与按编号查详情接口，并补齐 Swagger 注解。
- 现有拖拽、优先级切换、详情抽屉、新建/编辑链路保持可用。
