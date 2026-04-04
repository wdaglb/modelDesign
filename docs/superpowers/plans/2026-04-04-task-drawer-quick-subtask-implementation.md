# Task Drawer Quick Subtask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为任务详情抽屉补齐“子任务”独立页签、标题级快捷创建、子任务列表展示与“补充详情”链路，并保证父任务上下文内的数据同步刷新。

**Architecture:** 后端在现有任务域模型上新增一个“按父任务查询子任务列表”接口，直接复用现有 `ProjectTaskViewAssembler` 组装详情，避免新建重复 DTO/Assembler。前端在任务抽屉中拆出独立 `TaskSubtaskPanel`，通过轻量快捷创建调用现有任务创建接口，并统一失效父任务详情、子任务列表、任务列表、看板和我的待办缓存。

**Tech Stack:** Spring Boot 3 / MyBatis-Plus / React 18 / TanStack Query / Ant Design / Vitest / Testing Library

---

## 文件结构与职责

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
  - 新增 `/project/task/children` 查询入口。
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
  - 新增子任务列表编排方法，校验父任务存在并委托读模型服务查询。
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`
  - 实现按 `parentTaskId` 查询一级子任务并组装视图。
- `admin-rsbuild/src/api/modules/project-task.types.ts`
  - 补齐 `parentTaskId`、父任务摘要、子任务计数字段，并定义子任务列表响应类型。
- `admin-rsbuild/src/api/modules/project-task.ts`
  - 新增 `getChildren(parentTaskId)` 封装。
- `admin-rsbuild/src/constants/queryKey/project.ts`
  - 新增子任务列表缓存键。
- `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
  - 扩展抽屉页签，接入“子任务”页签和局部刷新逻辑。
- `admin-rsbuild/src/routes/agile-board/#TaskSubtaskPanel.tsx`
  - 承载快捷创建区、子任务列表区和“补充详情”动作。
- `admin-rsbuild/src/routes/agile-board/__tests__/TaskSubtaskPanel.test.tsx`
  - 覆盖快捷创建、默认负责人说明和回调触发的关键交互。

## Task 1: 后端补齐子任务列表查询接口

**Files:**
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`
- Verify: `modelDesign/mvnw`

- [ ] **Step 1: 先写出控制器和服务签名**

```java
// ProjectTaskController.java
@Operation(summary = "获取指定父任务下的子任务列表")
@GetMapping("/children")
public List<ProjectTaskDetailVo> children(
        @Parameter(description = "父任务 ID", required = true)
        @RequestParam
        @NotNull(message = "父任务 ID 不能为空") Long parentTaskId) {
    return projectTaskService.getChildren(parentTaskId);
}

// ProjectTaskService.java
public List<ProjectTaskDetailVo> getChildren(Long parentTaskId) {
    ProjectTask parentTask = requireTask(parentTaskId);
    return projectTaskReadService.getChildren(parentTask);
}
```

- [ ] **Step 2: 运行模块测试/编译，确认当前因为读模型方法不存在而失败**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && ./mvnw -pl mod-project/mod-project-biz -am test`

Expected: 编译失败，报 `getChildren(ProjectTask)` 未定义或类似符号缺失错误。

- [ ] **Step 3: 在读模型服务实现最小可用查询**

```java
// ProjectTaskReadService.java
public List<ProjectTaskDetailVo> getChildren(ProjectTask parentTask) {
    List<ProjectTask> childTasks = projectTaskMapper.selectList(new LambdaQueryWrapper<ProjectTask>()
            .eq(ProjectTask::getParentTaskId, parentTask.getId())
            .eq(ProjectTask::getDeleted, 0)
            .orderByDesc(ProjectTask::getUpdateTime));
    return projectTaskViewAssembler.toTaskVoList(childTasks);
}
```

- [ ] **Step 4: 重新运行模块测试/编译确认通过**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && ./mvnw -pl mod-project/mod-project-biz -am test`

Expected: `BUILD SUCCESS`

- [ ] **Step 5: 提交后端接口改动**

```bash
git add modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java \
        modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java \
        modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java
git commit -m "feat(task): add child task query endpoint"
```

## Task 2: 前端类型、接口封装与缓存键接线

**Files:**
- Modify: `admin-rsbuild/src/api/modules/project-task.types.ts`
- Modify: `admin-rsbuild/src/api/modules/project-task.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/project.ts`
- Verify: `admin-rsbuild/package.json`

- [ ] **Step 1: 先写失败测试或类型使用点，锁定缺失字段**

```ts
// 目标类型补齐
interface CreateProjectTaskParams {
  parentTaskId?: number;
}

interface ProjectTaskDetail {
  parentTaskId?: number;
  parentTaskTitle?: string;
  childTaskCount?: number;
  completedChildTaskCount?: number;
}

type ProjectTaskChildListResponse = ProjectTaskDetail[];
```

- [ ] **Step 2: 运行前端类型检查触发缺失报错**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run -- --runInBand`

Expected: 现阶段如果已经在 UI 侧引用这些字段，会出现类型缺失或 API 缺失报错；如果没有报错，继续下一步直接补齐类型。

- [ ] **Step 3: 实现类型、接口与缓存键**

```ts
// project-task.ts
export const getChildren = (
  parentTaskId: number,
): Promise<ProjectTaskChildListResponse> => {
  return request('/project/task/children', {
    method: 'get',
    params: { parentTaskId },
  });
};

// queryKey/project.ts
export const taskChildren = (parentTaskId: number) => [
  'projectTaskChildren',
  parentTaskId,
];
```

- [ ] **Step 4: 运行前端单测/类型验证，确认封装无语法问题**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run`

Expected: `Test Files` 全部通过，至少不出现 `project-task.ts` / `project-task.types.ts` / `queryKey/project.ts` 的类型错误。

- [ ] **Step 5: 提交前端基础接线**

```bash
git add admin-rsbuild/src/api/modules/project-task.types.ts \
        admin-rsbuild/src/api/modules/project-task.ts \
        admin-rsbuild/src/constants/queryKey/project.ts
git commit -m "feat(task): wire child task api on frontend"
```

## Task 3: 在任务抽屉中实现子任务页签与快捷创建面板

**Files:**
- Create: `admin-rsbuild/src/routes/agile-board/#TaskSubtaskPanel.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
- Modify: `admin-rsbuild/src/service/taskModalService.tsx`
- Verify: `admin-rsbuild/src/routes/agile-board/#TaskPreviewSummary.tsx`

- [ ] **Step 1: 先写面板组件测试，锁定交互**

```tsx
it('创建成功后调用刷新回调并清空输入框', async () => {
  vi.spyOn(ApiProjectTask, 'create').mockResolvedValue({
    id: 99,
    projectId: 1,
    title: '新增子任务',
    status: 'todo',
    priority: TaskPriority.Medium,
    assigneeId: 8,
    assignee: '父任务负责人',
  } as ProjectTaskDetail);

  render(
    <TaskSubtaskPanel
      parentTask={parentTask}
      statusConfigs={statusConfigs}
      onRefresh={vi.fn()}
      onEditTask={vi.fn()}
    />,
  );

  await user.type(screen.getByPlaceholderText('输入子任务标题后回车创建'), '新增子任务{enter}');

  expect(ApiProjectTask.create).toHaveBeenCalledWith(expect.objectContaining({
    parentTaskId: parentTask.id,
    assigneeId: parentTask.assigneeId,
    priority: parentTask.priority,
  }));
});
```

- [ ] **Step 2: 运行单测确认失败**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run -- src/routes/agile-board/__tests__/TaskSubtaskPanel.test.tsx`

Expected: FAIL，提示 `TaskSubtaskPanel` 不存在或关键交互未实现。

- [ ] **Step 3: 写最小实现并接入抽屉页签**

```tsx
// #TaskSubtaskPanel.tsx
const TaskSubtaskPanel = ({ parentTask, statusConfigs, onRefresh, onEditTask }: Props) => {
  const [title, setTitle] = useState('');
  const childrenQuery = useQuery({
    queryKey: queryKey.project.taskChildren(parentTask.id),
    queryFn: () => ApiProjectTask.getChildren(parentTask.id),
  });

  const handleCreate = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      message.warning('请输入子任务标题');
      return;
    }

    await ApiProjectTask.create({
      projectId: parentTask.projectId,
      parentTaskId: parentTask.id,
      title: normalizedTitle,
      assigneeId: parentTask.assigneeId,
      priority: parentTask.priority,
      status: resolveInitialStatus(statusConfigs),
    });
    setTitle('');
    await onRefresh();
  };
};

// #TaskPreviewDrawer.tsx tabs
{
  key: 'subtasks',
  label: '子任务',
  children: (
    <TaskSubtaskPanel
      parentTask={taskDetail}
      statusConfigs={props.statusConfigs}
      onRefresh={async () => {
        await Promise.all([
          props.onTaskUpdated(),
          queryClient.invalidateQueries({ queryKey: detailQueryKey }),
          queryClient.invalidateQueries({
            queryKey: queryKey.project.taskChildren(taskDetail.id),
          }),
        ]);
      }}
      onEditTask={props.onEdit}
    />
  ),
}
```

- [ ] **Step 4: 重新运行单测确认通过**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run -- src/routes/agile-board/__tests__/TaskSubtaskPanel.test.tsx`

Expected: PASS，断言快捷创建、说明文案和“补充详情”回调正常。

- [ ] **Step 5: 提交抽屉子任务面板**

```bash
git add admin-rsbuild/src/routes/agile-board/#TaskSubtaskPanel.tsx \
        admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx \
        admin-rsbuild/src/routes/agile-board/__tests__/TaskSubtaskPanel.test.tsx
git commit -m "feat(task): add quick subtask panel in drawer"
```

## Task 4: 补齐联动刷新、验证命令与回归检查

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board/#TaskSubtaskPanel.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
- Verify: `admin-rsbuild/package.json`
- Verify: `modelDesign/mvnw`

- [ ] **Step 1: 把外部缓存失效统一收口**

```tsx
await Promise.all([
  props.onTaskUpdated(),
  queryClient.invalidateQueries({ queryKey: detailQueryKey }),
  queryClient.invalidateQueries({
    queryKey: queryKey.project.taskChildren(taskDetail.id),
  }),
  queryClient.invalidateQueries({ queryKey: queryKey.project.taskList() }),
  queryClient.invalidateQueries({ queryKey: queryKey.project.taskBoard() }),
  queryClient.invalidateQueries({ queryKey: queryKey.todo.list() }),
]);
```

- [ ] **Step 2: 跑前端单测验证 UI 主路径**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm test:run -- src/routes/agile-board/__tests__/TaskSubtaskPanel.test.tsx`

Expected: PASS

- [ ] **Step 3: 跑前端构建，验证抽屉接线和类型**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/admin-rsbuild && pnpm build`

Expected: 构建成功，无 TypeScript / Rsbuild 编译错误。

- [ ] **Step 4: 再跑后端模块测试/编译，确认接口改动无回归**

Run: `cd /Users/wanz/web/wwwroot/modelDesign/modelDesign && ./mvnw -pl mod-project/mod-project-biz -am test`

Expected: `BUILD SUCCESS`

- [ ] **Step 5: 提交最终联动与验证结果**

```bash
git add admin-rsbuild/src/routes/agile-board/#TaskSubtaskPanel.tsx \
        admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx
git commit -m "feat(task): finalize drawer subtask refresh flow"
```

## 自检结论

- Spec coverage:
  - 独立“子任务”页签：Task 3
  - 标题级快捷创建：Task 3
  - 默认继承父任务负责人和优先级：Task 3
  - 创建成功留在当前抽屉并刷新：Task 3、Task 4
  - 子任务列表接口：Task 1
  - 前端 API / 类型接线：Task 2
  - “补充详情”复用完整任务表单：Task 3
- Placeholder scan:
  - 无 `TODO/TBD/待定/后补`
- Type consistency:
  - 统一使用 `parentTaskId`、`childTaskCount`、`completedChildTaskCount`、`taskChildren(parentTaskId)` 命名，前后端一致。
