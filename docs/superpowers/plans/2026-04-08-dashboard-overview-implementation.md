# Dashboard Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/dashboard` 首页概览页，接入真实聚合数据，登录后默认进入，并复用共享任务详情抽屉。

**Architecture:** 后端在 `mod-project` 内新增首页概览聚合查询服务与 VO，由控制器直接暴露 `/project/task/dashboard`；前端新增 `dashboard` API、查询键与页面路由，页面通过共享任务详情抽屉复用敏捷面板现有预览能力。`/my-todo` 新增 `range=today|week` 轻量筛选，登录页默认回跳改为 `/dashboard`，菜单通过 Flyway 迁移插入。

**Tech Stack:** React 18、TypeScript、TanStack Router、TanStack Query、Ant Design、Vitest、Spring Boot 3.5、MyBatis-Plus、PostgreSQL、Flyway、JUnit 5、Mockito

---

## 文件结构

- 后端接口与响应
  - Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardOverviewVo.java`
  - Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardSummaryVo.java`
  - Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardTaskItemVo.java`
  - Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardRiskItemVo.java`
  - Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryService.java`
  - Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
  - Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/MyTodoListRequest.java`
  - Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`

- 后端测试
  - Create: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java`
  - Modify: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskReadServiceTest.java`

- 前端共享能力
  - Create: `admin-rsbuild/src/components/business/TaskPreviewDrawer/index.tsx`
  - Create: `admin-rsbuild/src/service/taskPreviewDrawerService.tsx`
  - Modify: `admin-rsbuild/src/routes/agile-board/index.tsx`
  - Modify: `admin-rsbuild/src/components/index.ts`

- 前端 dashboard 页面
  - Create: `admin-rsbuild/src/api/modules/dashboard.types.ts`
  - Create: `admin-rsbuild/src/api/modules/dashboard.ts`
  - Create: `admin-rsbuild/src/constants/queryKey/dashboard.ts`
  - Create: `admin-rsbuild/src/routes/dashboard/index.tsx`
  - Create: `admin-rsbuild/src/routes/dashboard/#DashboardPage.tsx`
  - Create: `admin-rsbuild/src/routes/dashboard/#DashboardKpiRow.tsx`
  - Create: `admin-rsbuild/src/routes/dashboard/#DashboardTaskListCard.tsx`
  - Create: `admin-rsbuild/src/routes/dashboard/#DashboardRiskCard.tsx`
  - Modify: `admin-rsbuild/src/api/index.ts`
  - Modify: `admin-rsbuild/src/constants/queryKey/index.ts`

- 前端既有页面联动
  - Modify: `admin-rsbuild/src/routes/login/index.tsx`
  - Modify: `admin-rsbuild/src/routes/my-todo.tsx`
  - Modify: `admin-rsbuild/src/routes/my-todo/#TodoTable.tsx`
  - Modify: `admin-rsbuild/src/api/modules/todo.types.ts`
  - Modify: `admin-rsbuild/src/api/modules/todo.ts`

- 前端测试
  - Create: `admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx`
  - Create: `admin-rsbuild/src/routes/my-todo/__tests__/todoRange.test.tsx`
  - Create: `admin-rsbuild/src/routes/login/__tests__/loginRedirect.test.tsx`

- 数据迁移
  - Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260408153000__mod_auth_dashboard_menu.sql`

---

### Task 1: 后端首页概览契约与入口

**Files:**
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardOverviewVo.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardSummaryVo.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardTaskItemVo.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardRiskItemVo.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java`
- Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java`

- [ ] **Step 1: 写失败测试，先锁定控制器和返回结构**

```java
package io.github.modelDesign.project.service;

import io.github.modelDesign.project.controller.ProjectTaskController;
import io.github.modelDesign.project.response.ProjectTaskDashboardOverviewVo;
import io.github.modelDesign.project.response.ProjectTaskDashboardSummaryVo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectTaskDashboardQueryServiceTest {
    @Test
    void dashboardControllerShouldDelegateToDashboardQueryService() {
        ProjectTaskDashboardQueryService dashboardQueryService = mock(ProjectTaskDashboardQueryService.class);
        ProjectTaskDashboardOverviewVo expected = ProjectTaskDashboardOverviewVo.builder()
                .summary(ProjectTaskDashboardSummaryVo.builder()
                        .myTaskCount(26)
                        .todayTodoCount(9)
                        .weekTodoCount(31)
                        .doneTaskCount(18)
                        .build())
                .todayTodos(List.of())
                .weekTodos(List.of())
                .overdueRisks(List.of())
                .build();
        when(dashboardQueryService.getOverview()).thenReturn(expected);

        ProjectTaskController controller = new ProjectTaskController(
                mock(ProjectTaskService.class),
                mock(ProjectTaskBoardQueryService.class),
                dashboardQueryService
        );

        assertSame(expected, controller.dashboard());
    }
}
```

- [ ] **Step 2: 运行测试，确认当前缺少 dashboard 入口**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-project/mod-project-biz -Dtest=ProjectTaskDashboardQueryServiceTest test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: class ProjectTaskDashboardQueryService
cannot find symbol: method dashboard()
```

- [ ] **Step 3: 写最小契约实现，让控制器与 VO 编译通过**

```java
@Data
@Builder
@Schema(description = "首页概览响应")
public class ProjectTaskDashboardOverviewVo {
    @Schema(description = "汇总统计")
    private ProjectTaskDashboardSummaryVo summary;

    @Schema(description = "今日待办列表")
    private List<ProjectTaskDashboardTaskItemVo> todayTodos;

    @Schema(description = "本周待办列表")
    private List<ProjectTaskDashboardTaskItemVo> weekTodos;

    @Schema(description = "逾期风险列表")
    private List<ProjectTaskDashboardRiskItemVo> overdueRisks;
}

@Service
public class ProjectTaskDashboardQueryService {
    public ProjectTaskDashboardOverviewVo getOverview() {
        return ProjectTaskDashboardOverviewVo.builder().build();
    }
}

@RequiredArgsConstructor
public class ProjectTaskController {
    private final ProjectTaskService projectTaskService;
    private final ProjectTaskBoardQueryService projectTaskBoardQueryService;
    private final ProjectTaskDashboardQueryService projectTaskDashboardQueryService;

    @Operation(summary = "获取首页概览")
    @GetMapping("/dashboard")
    public ProjectTaskDashboardOverviewVo dashboard() {
        return projectTaskDashboardQueryService.getOverview();
    }
}
```

- [ ] **Step 4: 再跑一次后端测试，确认契约入口通过**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-project/mod-project-biz -Dtest=ProjectTaskDashboardQueryServiceTest test
```

Expected:

```text
BUILD SUCCESS
Tests run: 1, Failures: 0, Errors: 0
```

- [ ] **Step 5: 提交这一组契约改动**

```bash
git add \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskController.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardOverviewVo.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardSummaryVo.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardTaskItemVo.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDashboardRiskItemVo.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryService.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java
git commit -m "feat: #0 新增首页概览聚合契约"
```

### Task 2: 后端聚合查询规则与 `/my-todo` range 支持

**Files:**
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/MyTodoListRequest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskReadServiceTest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java`

- [ ] **Step 1: 先写失败测试，锁定 today/week/overdue 口径与 range 参数**

```java
@Test
void getOverviewShouldSplitTodayWeekAndOverdueWithUnifiedCounts() {
    ProjectTaskDashboardQueryService service = buildServiceWithClock("2026-04-08T10:00:00");

    ProjectTaskDashboardOverviewVo result = service.getOverview();

    assertEquals(26, result.getSummary().getMyTaskCount());
    assertEquals(9, result.getSummary().getTodayTodoCount());
    assertEquals(31, result.getSummary().getWeekTodoCount());
    assertEquals(18, result.getSummary().getDoneTaskCount());
    assertEquals(4, result.getTodayTodos().size());
    assertEquals(3, result.getWeekTodos().size());
    assertEquals(2, result.getOverdueRisks().size());
}

@Test
void getMyTodoListShouldApplyWeekRangeFilter() {
    MyTodoListRequest request = new MyTodoListRequest();
    request.setRange("week");
    request.setCurrent(1);
    request.setPageSize(10);

    service.getMyTodoList(request);

    QueryWrapper<ProjectTask> wrapper = captor.getValue();
    assertTrue(wrapper.getSqlSegment().contains("\"dueTime\""));
}
```

- [ ] **Step 2: 运行后端测试，确认当前没有 range 字段和聚合逻辑**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-project/mod-project-biz -Dtest=ProjectTaskDashboardQueryServiceTest,ProjectTaskReadServiceTest test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: method setRange(java.lang.String)
expected:<26> but was:<0>
```

- [ ] **Step 3: 实现首页概览聚合和 `MyTodoListRequest.range`**

```java
@Data
@Schema(description = "我的待办列表请求")
public class MyTodoListRequest {
    // 现有字段保留

    @Schema(description = "时间范围", allowableValues = {"today", "week"})
    @Size(max = 16, message = "时间范围长度不能超过 16 个字符")
    private String range;
}

@Service
@RequiredArgsConstructor
public class ProjectTaskDashboardQueryService {
    private final AuthCurrentUserApi authCurrentUserApi;
    private final ProjectTaskMapper projectTaskMapper;
    private final ProjectTaskViewAssembler projectTaskViewAssembler;

    public ProjectTaskDashboardOverviewVo getOverview() {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);

        List<ProjectTask> allTasks = loadCurrentUserTasks(currentUser.getTenantId(), currentUser.getUserId());
        List<ProjectTask> todayTodos = filterTodosByDate(allTasks, today, today);
        List<ProjectTask> weekTodos = filterTodosByDate(allTasks, today.plusDays(1), weekEnd);
        List<ProjectTask> overdueTasks = filterOverdueTasks(allTasks, today);

        return ProjectTaskDashboardOverviewVo.builder()
                .summary(ProjectTaskDashboardSummaryVo.builder()
                        .myTaskCount(allTasks.size())
                        .todayTodoCount(todayTodos.size())
                        .weekTodoCount(todayTodos.size() + weekTodos.size())
                        .doneTaskCount(countDoneTasks(allTasks))
                        .build())
                .todayTodos(toDashboardTaskItems(todayTodos))
                .weekTodos(toDashboardTaskItems(weekTodos))
                .overdueRisks(toRiskItems(overdueTasks))
                .build();
    }
}
```

- [ ] **Step 4: 重新运行后端测试，确认统计与筛选逻辑通过**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-project/mod-project-biz -Dtest=ProjectTaskDashboardQueryServiceTest,ProjectTaskReadServiceTest test
```

Expected:

```text
BUILD SUCCESS
Tests run: 10+, Failures: 0, Errors: 0
```

- [ ] **Step 5: 提交后端聚合规则**

```bash
git add \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/MyTodoListRequest.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryService.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskReadService.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskReadServiceTest.java
git commit -m "feat: #0 实现首页概览查询规则"
```

### Task 3: 抽离共享任务详情抽屉

**Files:**
- Create: `admin-rsbuild/src/components/business/TaskPreviewDrawer/index.tsx`
- Create: `admin-rsbuild/src/service/taskPreviewDrawerService.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/index.tsx`
- Modify: `admin-rsbuild/src/components/index.ts`
- Test: `admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx`

- [ ] **Step 1: 先写前端失败测试，锁定 dashboard 点击列表项会调起共享抽屉**

```tsx
it('点击概览列表项时调用共享任务详情抽屉', async () => {
  const openTaskPreviewDrawer = vi.fn().mockResolvedValue(undefined);
  vi.mock('@/service/taskPreviewDrawerService.tsx', () => ({
    openTaskPreviewDrawer,
  }));

  render(<DashboardPage />);
  await user.click(await screen.findByText('复核租户A模型版本发布单'));

  expect(openTaskPreviewDrawer).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ taskId: 101 }),
  );
});
```

- [ ] **Step 2: 运行前端测试，确认共享服务路径还不存在**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- src/routes/dashboard/__tests__/DashboardPage.test.tsx
```

Expected:

```text
Error: Failed to resolve import "@/service/taskPreviewDrawerService.tsx"
```

- [ ] **Step 3: 把抽屉组件与打开服务迁到共享位置**

```tsx
import TaskPreviewDrawer from '@/components/business/TaskPreviewDrawer';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

export async function openTaskPreviewDrawer(
  drawer: KDrawerInstance,
  options: OpenTaskPreviewDrawerOptions,
) {
  await drawer.open({
    title: '任务预览',
    size: 560,
    styles: {
      body: {
        padding: 0,
        height: '100%',
        overflow: 'hidden',
      },
    },
    children: (
      <TaskPreviewDrawer
        taskId={options.taskId}
        statusConfigs={options.statusConfigs}
        onTaskUpdated={options.onTaskUpdated}
        onEdit={options.onEdit}
      />
    ),
  });
}
```

- [ ] **Step 4: 跑敏捷面板相关测试，确认抽离没有回归**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- src/routes/agile-board/__tests__/agileBoardSearch.test.tsx src/routes/agile-board/__tests__/BoardColumn.test.tsx
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: 提交共享抽屉抽离**

```bash
git add \
  admin-rsbuild/src/components/business/TaskPreviewDrawer/index.tsx \
  admin-rsbuild/src/service/taskPreviewDrawerService.tsx \
  admin-rsbuild/src/routes/agile-board/index.tsx \
  admin-rsbuild/src/components/index.ts
git commit -m "refactor: #0 抽离任务详情抽屉"
```

### Task 4: 新增 dashboard API、查询键与页面骨架

**Files:**
- Create: `admin-rsbuild/src/api/modules/dashboard.types.ts`
- Create: `admin-rsbuild/src/api/modules/dashboard.ts`
- Create: `admin-rsbuild/src/constants/queryKey/dashboard.ts`
- Create: `admin-rsbuild/src/routes/dashboard/index.tsx`
- Create: `admin-rsbuild/src/routes/dashboard/#DashboardPage.tsx`
- Create: `admin-rsbuild/src/routes/dashboard/#DashboardKpiRow.tsx`
- Create: `admin-rsbuild/src/routes/dashboard/#DashboardTaskListCard.tsx`
- Create: `admin-rsbuild/src/routes/dashboard/#DashboardRiskCard.tsx`
- Modify: `admin-rsbuild/src/api/index.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/index.ts`
- Test: `admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx`

- [ ] **Step 1: 写失败测试，先锁定 loading / error / success 三态**

```tsx
it('加载成功时渲染四个 KPI 标题和三块列表卡片', async () => {
  vi.mock('@/api/modules/dashboard', () => ({
    getOverview: vi.fn().mockResolvedValue({
      summary: {
        myTaskCount: 26,
        todayTodoCount: 9,
        weekTodoCount: 31,
        doneTaskCount: 18,
      },
      todayTodos: [{ id: 101, projectId: 1, title: '复核租户A模型版本发布单', priority: 'high', status: 'todo' }],
      weekTodos: [],
      overdueRisks: [],
    }),
  }));

  render(<DashboardPage />);

  expect(await screen.findByText('我的任务')).toBeInTheDocument();
  expect(screen.getByText('今日待办')).toBeInTheDocument();
  expect(screen.getByText('本周待办')).toBeInTheDocument();
  expect(screen.getByText('已完成任务数')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行前端测试，确认 dashboard 路由和 API 还不存在**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- src/routes/dashboard/__tests__/DashboardPage.test.tsx
```

Expected:

```text
Error: Failed to resolve import "@/api/modules/dashboard"
Error: Failed to resolve import "../#DashboardPage"
```

- [ ] **Step 3: 写最小页面骨架与查询层**

```tsx
export interface DashboardOverviewResponse {
  summary: {
    myTaskCount: number;
    todayTodoCount: number;
    weekTodoCount: number;
    doneTaskCount: number;
  };
  todayTodos: DashboardTaskItem[];
  weekTodos: DashboardTaskItem[];
  overdueRisks: DashboardRiskItem[];
}

export const getOverview = (): Promise<DashboardOverviewResponse> => {
  return request('/project/task/dashboard', {
    method: 'get',
  });
};

export const overview = () => ['dashboardOverview'];

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardPage />;
}
```

- [ ] **Step 4: 重新运行 dashboard 页面测试，确认三态骨架通过**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- src/routes/dashboard/__tests__/DashboardPage.test.tsx
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: 提交 dashboard 基础页面**

```bash
git add \
  admin-rsbuild/src/api/modules/dashboard.types.ts \
  admin-rsbuild/src/api/modules/dashboard.ts \
  admin-rsbuild/src/constants/queryKey/dashboard.ts \
  admin-rsbuild/src/routes/dashboard/index.tsx \
  admin-rsbuild/src/routes/dashboard/#DashboardPage.tsx \
  admin-rsbuild/src/routes/dashboard/#DashboardKpiRow.tsx \
  admin-rsbuild/src/routes/dashboard/#DashboardTaskListCard.tsx \
  admin-rsbuild/src/routes/dashboard/#DashboardRiskCard.tsx \
  admin-rsbuild/src/api/index.ts \
  admin-rsbuild/src/constants/queryKey/index.ts \
  admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx
git commit -m "feat: #0 新增首页概览前端接口"
```

### Task 5: 接入交互、`/my-todo` range 与登录默认跳转

**Files:**
- Modify: `admin-rsbuild/src/routes/dashboard/#DashboardPage.tsx`
- Modify: `admin-rsbuild/src/routes/login/index.tsx`
- Modify: `admin-rsbuild/src/routes/my-todo.tsx`
- Modify: `admin-rsbuild/src/routes/my-todo/#TodoTable.tsx`
- Modify: `admin-rsbuild/src/api/modules/todo.types.ts`
- Modify: `admin-rsbuild/src/api/modules/todo.ts`
- Create: `admin-rsbuild/src/routes/my-todo/__tests__/todoRange.test.tsx`
- Create: `admin-rsbuild/src/routes/login/__tests__/loginRedirect.test.tsx`
- Modify: `admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx`

- [ ] **Step 1: 写失败测试，覆盖 KPI 跳转、range 参数、登录默认回跳**

```tsx
it('点击今日待办 KPI 时跳转到 my-todo week/today 查询', async () => {
  const navigate = vi.fn();
  vi.mock('@tanstack/react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-router')>();
    return {
      ...actual,
      useNavigate: () => navigate,
    };
  });

  render(<DashboardPage />);
  await user.click(await screen.findByRole('button', { name: '今日待办' }));

  expect(navigate).toHaveBeenCalledWith({
    to: '/my-todo',
    search: { range: 'today' },
  });
});

it('login 搜索参数默认 redirect 为 /dashboard', () => {
  expect(searchSchema.parse({})).toEqual({ redirect: '/dashboard' });
});
```

- [ ] **Step 2: 运行前端测试，确认现有默认值和 `/my-todo` 参数还不满足**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- \
  src/routes/dashboard/__tests__/DashboardPage.test.tsx \
  src/routes/my-todo/__tests__/todoRange.test.tsx \
  src/routes/login/__tests__/loginRedirect.test.tsx
```

Expected:

```text
expected "/" to be "/dashboard"
expected navigate to have been called with search.range
```

- [ ] **Step 3: 实现 dashboard 交互与 `/my-todo` range 参数**

```tsx
const searchSchema = z.object({
  redirect: z.string().optional().default('/dashboard'),
});

const myTodoSearchSchema = z.object({
  range: z.enum(['today', 'week']).optional(),
});

export const Route = createFileRoute('/my-todo')({
  component: RouteComponent,
  validateSearch: myTodoSearchSchema,
});

export interface TodoListParams {
  current?: number;
  pageSize?: number;
  title?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  range?: 'today' | 'week';
}

const params = useMemo(() => ({
  ...pagination,
  title: title.trim() || undefined,
  priority,
  status,
  range: props.range,
}), [pagination, priority, status, title, props.range]);
```

- [ ] **Step 4: 跑前端测试并补一次构建，确保路由生成和交互都通过**

Run:

```bash
pnpm --dir admin-rsbuild test:run -- \
  src/routes/dashboard/__tests__/DashboardPage.test.tsx \
  src/routes/my-todo/__tests__/todoRange.test.tsx \
  src/routes/login/__tests__/loginRedirect.test.tsx
pnpm --dir admin-rsbuild build
```

Expected:

```text
Test Files  3 passed
build completed successfully
```

- [ ] **Step 5: 提交交互联动改动**

```bash
git add \
  admin-rsbuild/src/routes/dashboard/#DashboardPage.tsx \
  admin-rsbuild/src/routes/login/index.tsx \
  admin-rsbuild/src/routes/my-todo.tsx \
  admin-rsbuild/src/routes/my-todo/#TodoTable.tsx \
  admin-rsbuild/src/api/modules/todo.types.ts \
  admin-rsbuild/src/api/modules/todo.ts \
  admin-rsbuild/src/routes/dashboard/__tests__/DashboardPage.test.tsx \
  admin-rsbuild/src/routes/my-todo/__tests__/todoRange.test.tsx \
  admin-rsbuild/src/routes/login/__tests__/loginRedirect.test.tsx
git commit -m "feat: #0 接入首页概览交互"
```

### Task 6: 菜单迁移与全量验证

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260408153000__mod_auth_dashboard_menu.sql`
- Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskDashboardQueryServiceTest.java`

- [ ] **Step 1: 先写迁移文件内容，明确菜单 ID、路径与排序**

```sql
INSERT INTO "menu" (
  "id",
  "parentId",
  "name",
  "title",
  "iconType",
  "iconValue",
  "path",
  "sort",
  "status",
  "nodeType",
  "createTime",
  "updateTime"
)
VALUES (
  11,
  0,
  '/dashboard',
  '首页概览',
  'mdi',
  'mdi:view-dashboard-outline',
  '/dashboard',
  1,
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "parentId" = EXCLUDED."parentId",
  "name" = EXCLUDED."name",
  "title" = EXCLUDED."title",
  "iconType" = EXCLUDED."iconType",
  "iconValue" = EXCLUDED."iconValue",
  "path" = EXCLUDED."path",
  "sort" = EXCLUDED."sort",
  "status" = EXCLUDED."status",
  "nodeType" = EXCLUDED."nodeType",
  "updateTime" = CURRENT_TIMESTAMP;

SELECT setval(
  pg_get_serial_sequence('"menu"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "menu"), 1),
  true
);
```

- [ ] **Step 2: 运行后端与前端全量关键验证**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-project/mod-project-biz test
pnpm --dir admin-rsbuild test:run
pnpm --dir admin-rsbuild build
```

Expected:

```text
BUILD SUCCESS
Test Files  all passed
build completed successfully
```

- [ ] **Step 3: 手工冒烟验证一次关键路径**

```text
1. 登录页不带 redirect 打开后，登录成功进入 /dashboard。
2. 左侧菜单出现“首页概览”，点击高亮正确。
3. KPI 卡片跳转到 /my-todo 时，today/week/status 筛选生效。
4. 点击今日待办、本周待办、逾期风险列表项，都会打开任务详情抽屉。
5. 在抽屉内修改任务状态后，/dashboard 的数字和列表会刷新。
```

- [ ] **Step 4: 提交菜单迁移与最终收尾**

```bash
git add modelDesign/boot/src/main/resources/db/migration/V1.20260408153000__mod_auth_dashboard_menu.sql
git commit -m "chore: #0 补充首页概览菜单迁移"
```

- [ ] **Step 5: 记录最终交付说明**

```text
- 后端：新增 /project/task/dashboard 聚合接口与 today/week/overdue 口径。
- 前端：新增 /dashboard 页面，登录默认进入，列表项复用共享任务详情抽屉。
- 联动：/my-todo 新增 range 查询参数。
- 数据：Flyway 迁移新增“首页概览”菜单。
```

## 自检结果

- Spec coverage
  - `/dashboard` 页面、登录默认跳转、KPI 导流、列表项抽屉、共享抽屉抽离、`/my-todo` range、菜单迁移、测试与验证都已映射到 Task 1 到 Task 6。
- Placeholder scan
  - 计划中未保留 `TODO`、`TBD`、`实现后补充` 一类占位词。
- Type consistency
  - 后端统一使用 `ProjectTaskDashboardOverviewVo`、`ProjectTaskDashboardTaskItemVo`、`ProjectTaskDashboardRiskItemVo`。
  - 前端统一使用 `DashboardOverviewResponse` 和 `TodoListParams.range`，避免出现重复命名。
