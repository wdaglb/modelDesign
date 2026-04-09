# Agile Board Directory Styled Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 `agile-board` 路由目录统一、`styled-components` 样式重构、一级子任务内嵌展示、任务编号复制与编号直达详情能力，同时保持现有看板拖拽与抽屉链路稳定。

**Architecture:** 后端先补齐“批量子任务查询 + 按编号查询详情”两个查询入口，继续复用 `ProjectTaskDetailVo` 和现有任务读模型组装逻辑，避免新造 DTO。由于当前任务实体没有独立编号列，按编号查询先按前端可见规则解析为任务 ID（例如 `TASK-2048` -> `2048`）再走详情查询；前端再把 `agile-board` 迁移为 `index.tsx + #私有目录`，通过适配层统一父任务/子任务卡片模型，并将页面壳层、列容器、卡片外观收敛到 `styled-components`，最后接入“编号优先、失败回退标题”的搜索策略。

**Tech Stack:** Spring Boot 3 / MyBatis-Plus / React 18 / TanStack Query / TanStack Router / styled-components / Ant Design / Vitest / Testing Library

---

## 文件结构与职责

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
  - 新增 `/project/task/children/batch` 与 `/project/task/detail/by-code` 控制器入口和 Swagger 注解。
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
  - 新增批量子任务查询与编号详情查询编排方法，负责父任务校验与异常语义。
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`
  - 实现按父任务 ID 列表查询一级子任务、按可见编号解析任务详情的读模型逻辑。
- `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceTest.java`
  - 覆盖批量子任务和编号查询的关键编排行为。
- `admin-rsbuild/src/api/modules/project-task.types.ts`
  - 定义批量子任务、编号详情查询响应，以及看板卡片模型所需的额外字段。
- `admin-rsbuild/src/api/modules/project-task.ts`
  - 新增 `getChildrenBatch` 与 `getDetailByCode` 请求封装。
- `admin-rsbuild/src/constants/queryKey/project.ts`
  - 新增批量子任务与编号详情缓存键。
- `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
  - 升级任务编号链接态、子任务紧凑态、复制交互阻断。
- `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
  - 扩展通用卡片 `compact` / `isSubtask` 这类展示入参。
- `admin-rsbuild/src/components/business/task-card/TaskCard.styled.tsx`
  - 抽离通用任务卡片样式。
- `admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx`
  - 覆盖编号复制、子任务紧凑态、点击阻断。
- `admin-rsbuild/src/routes/agile-board/index.tsx`
  - 作为新的路由入口，接入批量子任务、编号搜索和页面壳层样式。
- `admin-rsbuild/src/routes/agile-board/#components/BoardToolbar.tsx`
  - 承载“标题或编号”搜索框、筛选项与新建动作。
- `admin-rsbuild/src/routes/agile-board/#components/BoardColumn.tsx`
  - 渲染状态列、空列说明和父任务列表。
- `admin-rsbuild/src/routes/agile-board/#components/AgileBoardTaskCard.tsx`
  - 处理拖拽包装并接入父任务/子任务渲染。
- `admin-rsbuild/src/routes/agile-board/#components/SubtaskList.tsx`
  - 渲染父任务下的一级子任务缩进列表。
- `admin-rsbuild/src/routes/agile-board/#hooks/useBoardAutoRefresh.ts`
  - 保持自动刷新暂停逻辑不回归。
- `admin-rsbuild/src/routes/agile-board/#utils/helper.ts`
  - 增加编号识别、父子任务映射、空态与搜索判定辅助函数。
- `admin-rsbuild/src/routes/agile-board/#utils/taskCardAdapter.ts`
  - 统一父任务/子任务到卡片模型的映射。
- `admin-rsbuild/src/routes/agile-board/#utils/types.ts`
  - 声明看板卡片模型与批量子任务分组类型。
- `admin-rsbuild/src/routes/agile-board/#styles/board.styled.tsx`
  - 页面根容器、头部、列区域样式。
- `admin-rsbuild/src/routes/agile-board/#styles/toolbar.styled.tsx`
  - 工具栏和搜索框容器样式。
- `admin-rsbuild/src/routes/agile-board/#styles/column.styled.tsx`
  - 列容器、空列态、滚动区域样式。
- `admin-rsbuild/src/routes/agile-board/#styles/task-card-shell.styled.tsx`
  - 父子任务嵌套容器和缩进样式。
- `admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts`
  - 覆盖编号回退、父子任务适配规则。
- `admin-rsbuild/src/routes/agile-board/__tests__/agileBoardSearch.test.tsx`
  - 覆盖“编号优先、失败回退标题”搜索逻辑。
- `admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx`
  - 覆盖空列 `Empty` 与子任务缩进列表展示。

## Task 1: 后端补齐批量子任务与编号详情查询

**Files:**
- Create: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceTest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`
- Verify: `modelDesign/pom.xml`

- [ ] **Step 1: 先写失败测试，锁定服务层编排语义**

```java
@ExtendWith(MockitoExtension.class)
class ProjectTaskServiceTest {
    @InjectMocks
    private ProjectTaskService projectTaskService;

    @Mock
    private ProjectTaskReadService projectTaskReadService;

    @Spy
    private ProjectTaskViewAssembler projectTaskViewAssembler;

    @Test
    void shouldReturnChildrenForMatchedParentIds() {
        List<Long> parentTaskIds = List.of(101L, 102L);
        ProjectTask firstParent = new ProjectTask();
        firstParent.setId(101L);
        ProjectTask secondParent = new ProjectTask();
        secondParent.setId(102L);

        doReturn(firstParent).when(projectTaskService).requireTask(101L);
        doReturn(secondParent).when(projectTaskService).requireTask(102L);

        projectTaskService.getChildrenBatch(parentTaskIds);

        verify(projectTaskReadService).getChildrenBatch(List.of(firstParent, secondParent));
    }

    @Test
    void shouldDelegateDetailByCodeToReadService() {
        projectTaskService.getDetailByCode("TASK-2048");
        verify(projectTaskReadService).getDetailByVisibleNumber("TASK-2048");
    }
}
```

- [ ] **Step 2: 运行测试确认因方法缺失而失败**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskServiceTest test`

Expected: FAIL，报 `getChildrenBatch` 或 `getDetailByCode` 未定义。

- [ ] **Step 3: 先补控制器与服务方法签名**

```java
// ProjectTaskController.java
@Operation(summary = "批量获取子任务列表")
@GetMapping("/children/batch")
public List<ProjectTaskDetailVo> childrenBatch(
        @Parameter(description = "父任务 ID 列表", required = true)
        @RequestParam List<Long> parentTaskIds) {
    return projectTaskService.getChildrenBatch(parentTaskIds);
}

@Operation(summary = "按任务编号获取任务详情")
@GetMapping("/detail/by-code")
public ProjectTaskDetailVo detailByCode(
        @Parameter(description = "任务编号", required = true)
        @RequestParam @NotBlank(message = "任务编号不能为空") String code) {
    return projectTaskService.getDetailByCode(code);
}

// ProjectTaskService.java
public List<ProjectTaskDetailVo> getChildrenBatch(List<Long> parentTaskIds) {
    List<ProjectTask> parentTasks = parentTaskIds.stream()
            .distinct()
            .map(this::requireTask)
            .toList();
    return projectTaskReadService.getChildrenBatch(parentTasks);
}

public ProjectTaskDetailVo getDetailByCode(String code) {
    return projectTaskReadService.getDetailByVisibleNumber(code.trim());
}
```

- [ ] **Step 4: 实现读模型最小查询逻辑**

```java
// ProjectTaskReadService.java
public List<ProjectTaskDetailVo> getChildrenBatch(List<ProjectTask> parentTasks) {
    if (parentTasks.isEmpty()) {
        return Collections.emptyList();
    }
    List<Long> parentTaskIds = parentTasks.stream()
            .map(ProjectTask::getId)
            .toList();
    List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
            .in(ProjectTask::getParentTaskId, parentTaskIds)
            .eq(ProjectTask::getDeleted, 0)
            .orderByDesc(ProjectTask::getUpdateTime));
    return projectTaskViewAssembler.toTaskVoList(childTasks);
}

public ProjectTaskDetailVo getDetailByVisibleNumber(String code) {
    Long taskId = parseVisibleTaskNumber(code);
    ProjectTask task = projectTaskMapper.selectOne(new LambdaQueryWrapper<ProjectTask>()
            .eq(ProjectTask::getId, taskId)
            .eq(ProjectTask::getDeleted, 0));
    if (task == null) {
        throw new BusinessException(HttpStatus.NOT_FOUND.value(), "任务不存在");
    }
    return projectTaskViewAssembler.toTaskVo(task);
}

private Long parseVisibleTaskNumber(String code) {
    String normalizedCode = code.trim();
    if (normalizedCode.matches("^TASK-\\d+$")) {
        return Long.valueOf(normalizedCode.substring("TASK-".length()));
    }
    if (normalizedCode.matches("^\\d+$")) {
        return Long.valueOf(normalizedCode);
    }
    throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "任务编号格式不正确");
}
```

- [ ] **Step 5: 重新运行测试与模块编译**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskServiceTest test`

Expected: `BUILD SUCCESS`

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && mvn -pl mod-project -am -DskipTests compile`

Expected: `BUILD SUCCESS`

- [ ] **Step 6: 提交后端查询能力**

```bash
git add modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java \
        modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java \
        modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java \
        modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceTest.java
git commit -m "feat(task): add batch child query and code detail api"
```

## Task 2: 前端补齐类型、接口封装与查询键

**Files:**
- Modify: `admin-rsbuild/src/api/modules/project-task.types.ts`
- Modify: `admin-rsbuild/src/api/modules/project-task.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/project.ts`
- Test: `admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts`

- [ ] **Step 1: 先写失败测试，锁定新接口类型**

```ts
it('优先使用 taskNo 作为任务编号', () => {
  const task = mapAgileBoardTaskToTaskCardTask({
    id: 9,
    projectId: 1,
    title: '统一编号查询逻辑',
    status: 'todo',
    priority: 'medium',
    taskNo: 'TASK-9',
  } as any);

  expect(task.taskNumber).toBe('TASK-9');
});
```

- [ ] **Step 2: 运行测试确认类型或接口定义仍不完整**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/taskCardAdapter.test.ts`

Expected: FAIL，提示 `taskNo`、`getChildrenBatch` 或 `taskChildrenBatch` 等字段未定义。

- [ ] **Step 3: 补齐接口类型和请求封装**

```ts
// project-task.types.ts
export type ProjectTaskChildrenBatchResponse = ProjectTaskDetail[];

export interface ProjectTaskDetailByCodeParams {
  code: string;
}

// project-task.ts
export const getChildrenBatch = (
  parentTaskIds: number[],
): Promise<ProjectTaskChildrenBatchResponse> => {
  return request('/project/task/children/batch', {
    method: 'get',
    params: { parentTaskIds },
  });
};

export const getDetailByCode = (code: string): Promise<ProjectTaskDetail> => {
  return request('/project/task/detail/by-code', {
    method: 'get',
    params: { code },
  });
};

// queryKey/project.ts
export const taskChildrenBatch = (parentTaskIds: number[]) => [
  'projectTaskChildrenBatch',
  [...parentTaskIds].sort((left, right) => left - right),
];

export const taskDetailByCode = (code: string) => ['projectTaskDetailByCode', code];
```

- [ ] **Step 4: 重跑适配器测试与前端测试集合**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/taskCardAdapter.test.ts`

Expected: PASS

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run`

Expected: `Test Files` 全部通过

- [ ] **Step 5: 提交前端接口接线**

```bash
git add admin-rsbuild/src/api/modules/project-task.types.ts \
        admin-rsbuild/src/api/modules/project-task.ts \
        admin-rsbuild/src/constants/queryKey/project.ts \
        admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts
git commit -m "feat(task): wire batch child and code detail apis"
```

## Task 3: 统一 agile-board 路由目录与私有文件结构

**Files:**
- Create: `admin-rsbuild/src/routes/agile-board/index.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#components/BoardToolbar.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#components/BoardColumn.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#components/AgileBoardTaskCard.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#utils/helper.ts`
- Create: `admin-rsbuild/src/routes/agile-board/#utils/taskCardAdapter.ts`
- Create: `admin-rsbuild/src/routes/agile-board/#utils/types.ts`
- Create: `admin-rsbuild/src/routes/agile-board/#hooks/useBoardAutoRefresh.ts`
- Create: `admin-rsbuild/src/routes/agile-board/#services/previewDrawerService.tsx`
- Delete: `admin-rsbuild/src/routes/agile-board.tsx`
- Verify: `admin-rsbuild/src/routeTree.gen.ts`

- [ ] **Step 1: 先写路由存在性测试，锁定入口迁移**

```ts
it('agile board route should export Route from index file', async () => {
  const routeModule = await import('../index');
  expect(routeModule.Route).toBeDefined();
});
```

- [ ] **Step 2: 运行测试或构建确认旧入口路径仍被依赖**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm build`

Expected: FAIL 或 route tree 仍引用 `src/routes/agile-board.tsx`，需要迁移入口。

- [ ] **Step 3: 创建新入口并更新引用**

```tsx
// src/routes/agile-board/index.tsx
export const Route = createFileRoute('/agile-board/')({
  component: AgileBoardPage,
});

function AgileBoardPage() {
  return <AgileBoardScene />;
}
```

```ts
// rsbuild.config.ts 保持不变，继续依赖 routeFileIgnorePrefix: '#'
TanStackRouterRspack({
  target: 'react',
  autoCodeSplitting: true,
  routeFileIgnorePrefix: '#',
  routeFileIgnorePattern: '^(components|__[^.]+)$',
});
```

- [ ] **Step 4: 重新生成路由树并验证构建**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm build`

Expected: PASS，且 `src/routeTree.gen.ts` 引用 `src/routes/agile-board/index.tsx`

- [ ] **Step 5: 提交目录统一改动**

```bash
git add admin-rsbuild/src/routes/agile-board \
        admin-rsbuild/src/routeTree.gen.ts \
        admin-rsbuild/rsbuild.config.ts
git commit -m "refactor(agile-board): move route entry into directory"
```

## Task 4: 提取页面 styled-components 并补齐空列样式

**Files:**
- Create: `admin-rsbuild/src/routes/agile-board/#styles/board.styled.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#styles/toolbar.styled.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#styles/column.styled.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#styles/task-card-shell.styled.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#components/BoardToolbar.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#components/BoardColumn.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx`

- [ ] **Step 1: 先写空列测试，锁定 `Empty` 说明**

```tsx
it('列无数据时展示 Empty 说明', () => {
  render(
    <BoardColumn
      column={column}
      tasks={[]}
      onPreview={vi.fn()}
      onPriorityChange={vi.fn()}
    />,
  );

  expect(screen.getByText('拖拽任务到这里')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认当前样式结构或文本不满足**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/BoardColumn.test.tsx`

Expected: FAIL，提示 `BoardColumn` 路径变化或 `Empty` 文案不匹配。

- [ ] **Step 3: 用 styled-components 抽出页面壳层与列样式**

```tsx
// #styles/column.styled.tsx
export const ColumnSurface = styled(Card)<{ $accentColor: string; $isOver: boolean }>`
  height: 100%;
  border-radius: 22px;
  border: 1px solid
    ${(props) => {
      if (props.$isOver) {
        return props.$accentColor;
      }
      return 'rgba(15, 23, 42, 0.08)';
    }};
  box-shadow: ${(props) => {
    if (props.$isOver) {
      return `0 18px 36px ${props.$accentColor}22`;
    }
    return '0 10px 24px rgba(15, 23, 42, 0.06)';
  }};
`;

export const EmptyDropZone = styled.div<{ $accentColor: string }>`
  min-height: 220px;
  border-radius: 16px;
  border: 1px dashed ${(props) => `${props.$accentColor}33`};
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
`;
```

- [ ] **Step 4: 重跑空列测试和前端测试**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/BoardColumn.test.tsx`

Expected: PASS

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run`

Expected: `Test Files` 全部通过

- [ ] **Step 5: 提交页面样式壳层**

```bash
git add admin-rsbuild/src/routes/agile-board/#styles \
        admin-rsbuild/src/routes/agile-board/#components/BoardToolbar.tsx \
        admin-rsbuild/src/routes/agile-board/#components/BoardColumn.tsx \
        admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx
git commit -m "style(agile-board): extract board layout styles"
```

## Task 5: 升级通用 TaskCard，支持链接式编号和子任务紧凑态

**Files:**
- Create: `admin-rsbuild/src/components/business/task-card/TaskCard.styled.tsx`
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
- Modify: `admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx`

- [ ] **Step 1: 先写失败测试，锁定链接式编号与紧凑态**

```tsx
it('点击链接式任务编号时复制内容并阻断预览', async () => {
  const onPreview = vi.fn();
  render(<TaskCard task={task} onPreview={onPreview} />);

  await user.click(screen.getByText('TASK-101'));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TASK-101');
  expect(onPreview).not.toHaveBeenCalled();
});

it('子任务紧凑态会缩小标题和元信息间距', () => {
  render(<TaskCard task={task} compact isSubtask />);
  expect(screen.getByTestId('task-card-root')).toHaveAttribute('data-compact', 'true');
});
```

- [ ] **Step 2: 运行测试确认当前卡片结构尚未支持**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/components/business/task-card/__tests__/TaskCard.test.tsx`

Expected: FAIL，提示 `compact` 或 `data-compact` 不存在。

- [ ] **Step 3: 抽样式文件并实现最小卡片升级**

```tsx
// TaskCard.types.ts
export interface TaskCardProps {
  task: TaskCardTask;
  compact?: boolean;
  isSubtask?: boolean;
  isOverlay?: boolean;
  disabled?: boolean;
}

// TaskCard.tsx
const taskNumberText = getTaskNumberText(props.task);

return (
  <CardRoot
    data-testid="task-card-root"
    data-compact={props.compact ? 'true' : 'false'}
    $compact={Boolean(props.compact)}
    $isSubtask={Boolean(props.isSubtask)}
    onClick={handleMergedRootClick}
  >
    <TaskNumberLink
      data-task-card-copy-trigger="true"
      onClick={handleCopyTaskNumber}
    >
      {taskNumberText}
    </TaskNumberLink>
  </CardRoot>
);
```

- [ ] **Step 4: 重跑卡片测试与全量前端测试**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/components/business/task-card/__tests__/TaskCard.test.tsx`

Expected: PASS

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run`

Expected: `4` 个以上测试文件全部通过

- [ ] **Step 5: 提交通用卡片升级**

```bash
git add admin-rsbuild/src/components/business/task-card/TaskCard.styled.tsx \
        admin-rsbuild/src/components/business/task-card/TaskCard.tsx \
        admin-rsbuild/src/components/business/task-card/TaskCard.types.ts \
        admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx
git commit -m "feat(task-card): support link-style id and compact mode"
```

## Task 6: 接入批量子任务、编号搜索与最终页面联调

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board/index.tsx`
- Create: `admin-rsbuild/src/routes/agile-board/#components/SubtaskList.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#components/AgileBoardTaskCard.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#utils/helper.ts`
- Modify: `admin-rsbuild/src/routes/agile-board/#utils/taskCardAdapter.ts`
- Modify: `admin-rsbuild/src/routes/agile-board/#utils/types.ts`
- Create: `admin-rsbuild/src/routes/agile-board/__tests__/agileBoardSearch.test.tsx`

- [ ] **Step 1: 先写失败测试，锁定编号优先搜索与回退**

```tsx
it('输入任务编号时优先打开详情抽屉，查不到再回退标题搜索', async () => {
  vi.spyOn(ApiProjectTask, 'getDetailByCode')
    .mockRejectedValueOnce(new Error('not found'));

  const setFilters = vi.fn();

  await handleBoardSearch('TASK-404', {
    openByCode: ApiProjectTask.getDetailByCode,
    fallbackToTitle: setFilters,
  });

  expect(ApiProjectTask.getDetailByCode).toHaveBeenCalledWith('TASK-404');
  expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ title: 'TASK-404' }));
});
```

- [ ] **Step 2: 运行测试确认搜索辅助函数尚不存在**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/agileBoardSearch.test.tsx`

Expected: FAIL，提示 `handleBoardSearch` 或 `looksLikeTaskNumber` 未定义。

- [ ] **Step 3: 接入批量子任务与搜索策略**

```tsx
// index.tsx
const parentTaskIds = useMemo(() => boardTasks.map((task) => task.id), [boardTasks]);

const { data: childTasks = [] } = useQuery({
  queryKey: queryKey.project.taskChildrenBatch(parentTaskIds),
  queryFn: () => ApiProjectTask.getChildrenBatch(parentTaskIds),
  enabled: parentTaskIds.length > 0,
});

const childTaskGroup = useMemo(() => groupChildTasksByParentId(childTasks), [childTasks]);

const handleSearch = async (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    setFilters((current) => ({ ...current, title: '' }));
    return;
  }
  if (looksLikeTaskNumber(normalizedValue)) {
    try {
      const detailTask = await ApiProjectTask.getDetailByCode(normalizedValue);
      await openTaskPreview(detailTask as AgileBoardTask);
      return;
    } catch {
      setFilters((current) => ({ ...current, title: normalizedValue }));
      return;
    }
  }
  setFilters((current) => ({ ...current, title: normalizedValue }));
};
```

```tsx
// SubtaskList.tsx
export default function SubtaskList(props: { tasks: AgileBoardTaskCardModel[] }) {
  if (!props.tasks.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无子任务" />;
  }
  return props.tasks.map((task) => (
    <SubtaskItem key={task.id}>
      <TaskCard task={task} compact isSubtask />
    </SubtaskItem>
  ));
}
```

- [ ] **Step 4: 运行搜索测试、适配器测试与全量前端测试**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && ./node_modules/.bin/vitest run src/routes/agile-board/__tests__/agileBoardSearch.test.tsx src/routes/agile-board/__tests__/taskCardAdapter.test.ts`

Expected: PASS

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run`

Expected: 所有前端测试通过

- [ ] **Step 5: 做最终联编验证**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && mvn -pl mod-project -am -DskipTests compile`

Expected: `BUILD SUCCESS`

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm build`

Expected: `build` 成功，路由扫描不再引用旧的 `agile-board.tsx`

- [ ] **Step 6: 提交最终联调改动**

```bash
git add admin-rsbuild/src/routes/agile-board/index.tsx \
        admin-rsbuild/src/routes/agile-board/#components/SubtaskList.tsx \
        admin-rsbuild/src/routes/agile-board/#components/AgileBoardTaskCard.tsx \
        admin-rsbuild/src/routes/agile-board/#utils/helper.ts \
        admin-rsbuild/src/routes/agile-board/#utils/taskCardAdapter.ts \
        admin-rsbuild/src/routes/agile-board/#utils/types.ts \
        admin-rsbuild/src/routes/agile-board/__tests__/agileBoardSearch.test.tsx
git commit -m "feat(agile-board): finish directory and styled redesign"
```

## 自检结果

- Spec coverage:
  - 目录统一与 `#私有目录`：Task 3
  - 页面 `styled-components` 化：Task 4
  - 编号链接式复制：Task 5
  - 一级子任务缩进展示：Task 6
  - 空列 `Empty`：Task 4
  - 批量子任务接口：Task 1、Task 2、Task 6
  - 按编号查详情：Task 1、Task 2、Task 6
  - 搜索框“编号优先、失败回退标题”：Task 6
- Placeholder scan:
  - 已移除占位词和“稍后实现”类模糊语句。
- Type consistency:
  - 批量子任务统一使用 `getChildrenBatch` / `taskChildrenBatch`
  - 编号查询统一使用 `getDetailByCode` / `taskDetailByCode`
  - 卡片紧凑态统一使用 `compact` + `isSubtask`
