# 敏捷面板任务时长字段调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `/agile-board` 的任务卡片与任务预览抽屉移除截止时间，改为展示“指派至今”和“创建至今”，并由后端稳定返回负责人最新指派时间与对应天数字段。

**Architecture:** 后端先补齐 `projectTask.assigneeAssignedAt` 持久化字段，并用一个纯时间计算支持类统一处理“负责人变化时如何重置时间”和“如何计算经过天数”。前端只消费新的接口字段：卡片层改通用 `TaskCard` 与敏捷面板适配器，抽屉层单独替换概要信息，避免在前端自己推导时长口径。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Flyway、JUnit 5、Mockito、React 18、TypeScript、Ant Design、Vitest、Testing Library

---

## 文件结构与职责

- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260408110000__mod_project_task_assignee_assigned_at.sql`
  - 为 `projectTask` 增加负责人最新指派时间字段，并回填历史数据
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupport.java`
  - 统一封装负责人指派时间解析与时长天数计算
- Create/Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupportTest.java`
  - 验证时间口径与负责人切换规则
- Create/Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceAssignmentTimeTest.java`
  - 验证创建、改派、取消指派时服务层正确写入 `assigneeAssignedAt`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTask.java`
  - 为任务实体补充 `assigneeAssignedAt`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
  - 在创建与编辑链路中维护 `assigneeAssignedAt`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskViewAssembler.java`
  - 为任务详情与看板数据组装 `assigneeAssignedAt`、`assigneeElapsedDays`、`createdElapsedDays`
- Modify/Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskViewAssemblerTest.java`
  - 验证任务详情 VO 包含新增字段和值
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDetailVo.java`
  - 增加 Swagger 注解过的新字段
- Modify: `admin-rsbuild/src/api/modules/project-task.types.ts`
  - 补齐前端接口类型
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
  - 通用任务卡片模型改为消费时长字段
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
  - 移除截止时间文案，新增时长元信息
- Modify/Test: `admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx`
  - 验证卡片不再显示截止时间，并正确显示时长
- Modify: `admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts`
  - 把接口返回的时长字段映射到通用卡片模型
- Modify/Test: `admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts`
  - 验证看板任务映射逻辑
- Modify: `admin-rsbuild/src/routes/agile-board/#helper.ts`
  - 提供抽屉所需的指派时间与时长文案
- Modify: `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
  - 替换抽屉概要区“排期与责任”字段
- Create/Test: `admin-rsbuild/src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx`
  - 验证抽屉移除截止时间并展示新字段

### Task 1: 先把时间口径独立成可测试的后端支持类

**Files:**
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupport.java`
- Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupportTest.java`

- [ ] **Step 1: 先写 `ProjectTaskTimeMetricsSupportTest.java`，锁定创建、改派、取消指派和天数计算规则**

```java
package io.github.modelDesign.project.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProjectTaskTimeMetricsSupportTest {
    @Test
    void resolveAssigneeAssignedAtOnCreateShouldReturnNowWhenAssigneePresent() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(now, support.resolveAssigneeAssignedAtOnCreate(18L, now));
        assertNull(support.resolveAssigneeAssignedAtOnCreate(null, now));
    }

    @Test
    void resolveAssigneeAssignedAtOnEditShouldResetOnlyWhenAssigneeChanges() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime previousAssignedAt = LocalDateTime.of(2026, 4, 4, 9, 0, 0);
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(
                previousAssignedAt,
                support.resolveAssigneeAssignedAtOnEdit(7L, 7L, previousAssignedAt, now)
        );
        assertEquals(
                now,
                support.resolveAssigneeAssignedAtOnEdit(null, 7L, previousAssignedAt, now)
        );
        assertEquals(
                now,
                support.resolveAssigneeAssignedAtOnEdit(7L, 8L, previousAssignedAt, now)
        );
        assertNull(support.resolveAssigneeAssignedAtOnEdit(7L, null, previousAssignedAt, now));
    }

    @Test
    void calculateElapsedDaysShouldFloorToWholeDays() {
        ProjectTaskTimeMetricsSupport support = new ProjectTaskTimeMetricsSupport();
        LocalDateTime now = LocalDateTime.of(2026, 4, 8, 10, 0, 0);

        assertEquals(0, support.calculateElapsedDays(now.minusHours(5), now));
        assertEquals(3, support.calculateElapsedDays(now.minusDays(3), now));
        assertNull(support.calculateElapsedDays(null, now));
    }
}
```

- [ ] **Step 2: 运行新增后端测试，确认支持类还不存在时先失败**

Run:

```bash
cd modelDesign
mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskTimeMetricsSupportTest test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol
  class ProjectTaskTimeMetricsSupport
```

- [ ] **Step 3: 实现 `ProjectTaskTimeMetricsSupport.java`，把规则收敛到一个纯逻辑类**

```java
package io.github.modelDesign.project.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * 任务时间指标支持类。
 */
public class ProjectTaskTimeMetricsSupport {
    /**
     * 解析创建任务时的负责人指派时间。
     *
     * @param assigneeId 负责人 ID
     * @param now 当前时间
     * @return 指派时间
     */
    public LocalDateTime resolveAssigneeAssignedAtOnCreate(Long assigneeId,
                                                           LocalDateTime now) {
        if (assigneeId == null || assigneeId.equals(0L)) {
            return null;
        }
        return now;
    }

    /**
     * 解析编辑任务时的负责人指派时间。
     *
     * @param previousAssigneeId 变更前负责人
     * @param currentAssigneeId 变更后负责人
     * @param previousAssignedAt 变更前指派时间
     * @param now 当前时间
     * @return 更新后的指派时间
     */
    public LocalDateTime resolveAssigneeAssignedAtOnEdit(Long previousAssigneeId,
                                                         Long currentAssigneeId,
                                                         LocalDateTime previousAssignedAt,
                                                         LocalDateTime now) {
        if (currentAssigneeId == null || currentAssigneeId.equals(0L)) {
            return null;
        }
        if (Objects.equals(previousAssigneeId, currentAssigneeId)) {
            return previousAssignedAt;
        }
        return now;
    }

    /**
     * 计算从起始时间到当前时间的完整天数。
     *
     * @param startAt 起始时间
     * @param now 当前时间
     * @return 完整天数
     */
    public Integer calculateElapsedDays(LocalDateTime startAt,
                                        LocalDateTime now) {
        if (startAt == null) {
            return null;
        }
        long days = ChronoUnit.DAYS.between(startAt, now);
        if (days < 0) {
            return 0;
        }
        return (int) days;
    }
}
```

- [ ] **Step 4: 重新运行支持类测试，确认三组规则全部转绿**

Run:

```bash
cd modelDesign
mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskTimeMetricsSupportTest test
```

Expected:

```text
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 5: 提交支持类基础能力**

```bash
git add modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupport.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskTimeMetricsSupportTest.java
git commit -m "feat: #0 增加任务时间指标支持类"
```

### Task 2: 把负责人指派时间写入任务模型，并让接口返回新字段

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260408110000__mod_project_task_assignee_assigned_at.sql`
- Create/Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceAssignmentTimeTest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTask.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskViewAssembler.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDetailVo.java`
- Modify/Test: `modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskViewAssemblerTest.java`

- [ ] **Step 1: 先写服务层失败测试，锁定创建和改派时 `assigneeAssignedAt` 的写入**

```java
@Test
void createShouldWriteAssigneeAssignedAtWhenAssigneePresent() {
    ProjectTaskTimeMetricsSupport timeSupport = mock(ProjectTaskTimeMetricsSupport.class);
    ProjectTaskService service = spy(buildService(timeSupport));
    ProjectTaskCreateRequest request = new ProjectTaskCreateRequest();
    request.setProjectId(1L);
    request.setTitle("新增指派时间");
    request.setStatus("todo");
    request.setPriority("medium");
    request.setAssigneeId(9L);

    LocalDateTime assignedAt = LocalDateTime.of(2026, 4, 8, 11, 0, 0);
    when(timeSupport.resolveAssigneeAssignedAtOnCreate(eq(9L), any(LocalDateTime.class)))
            .thenReturn(assignedAt);
    doReturn(true).when(service).save(any(ProjectTask.class));
    when(service.getBaseMapper()).thenReturn(mock(ProjectTaskMapper.class));

    service.create(request);

    ArgumentCaptor<ProjectTask> captor = ArgumentCaptor.forClass(ProjectTask.class);
    verify(service).save(captor.capture());
    assertEquals(assignedAt, captor.getValue().getAssigneeAssignedAt());
}

@Test
void editShouldResetAssigneeAssignedAtWhenAssigneeChanges() {
    ProjectTaskTimeMetricsSupport timeSupport = mock(ProjectTaskTimeMetricsSupport.class);
    ProjectTaskService service = spy(buildService(timeSupport));
    ProjectTask existing = new ProjectTask();
    existing.setId(5L);
    existing.setProjectId(1L);
    existing.setTitle("改派负责人");
    existing.setStatus("todo");
    existing.setPriority("medium");
    existing.setAssigneeId(9L);
    existing.setAssigneeAssignedAt(LocalDateTime.of(2026, 4, 2, 9, 0, 0));

    ProjectTaskEditRequest request = new ProjectTaskEditRequest();
    request.setTitle("改派负责人");
    request.setStatus("todo");
    request.setPriority("medium");
    request.setAssigneeId(12L);

    LocalDateTime reassignedAt = LocalDateTime.of(2026, 4, 8, 12, 0, 0);
    when(timeSupport.resolveAssigneeAssignedAtOnEdit(
            eq(9L),
            eq(12L),
            eq(existing.getAssigneeAssignedAt()),
            any(LocalDateTime.class)
    )).thenReturn(reassignedAt);

    doReturn(existing).when(service).requireTask(5L);
    doReturn(true).when(service).updateById(any(ProjectTask.class));

    service.edit(5L, request);

    assertEquals(reassignedAt, existing.getAssigneeAssignedAt());
}

private ProjectTaskService buildService(ProjectTaskTimeMetricsSupport timeSupport) {
    AuthCurrentUserApi currentUserApi = mock(AuthCurrentUserApi.class);
    ProjectService projectService = mock(ProjectService.class);
    ProjectTaskReadService readService = mock(ProjectTaskReadService.class);
    ProjectTaskGuardService guardService = mock(ProjectTaskGuardService.class);
    ProjectTaskLifecycleService lifecycleService = mock(ProjectTaskLifecycleService.class);
    ProjectTaskDependencyService dependencyService = mock(ProjectTaskDependencyService.class);
    ProjectTaskTagBindingService tagBindingService = mock(ProjectTaskTagBindingService.class);
    ProjectTaskViewAssembler viewAssembler = mock(ProjectTaskViewAssembler.class);
    ProjectTaskChangeLogService changeLogService = mock(ProjectTaskChangeLogService.class);

    Project project = new Project();
    project.setId(1L);
    AuthCurrentUserDto currentUser = new AuthCurrentUserDto();
    currentUser.setUserId(100L);
    when(currentUserApi.getCurrentUser()).thenReturn(currentUser);
    when(projectService.requireProject(1L)).thenReturn(project);
    when(guardService.validateStatus(anyString())).thenAnswer((invocation) -> invocation.getArgument(0));
    when(readService.getDetailByVisibleNumber(anyString())).thenReturn(null);
    when(viewAssembler.toTaskVo(any(ProjectTask.class)))
            .thenReturn(ProjectTaskDetailVo.builder().id(1L).build());

    return new ProjectTaskService(
            currentUserApi,
            projectService,
            readService,
            guardService,
            lifecycleService,
            dependencyService,
            tagBindingService,
            viewAssembler,
            changeLogService,
            timeSupport
    );
}
```

- [ ] **Step 2: 运行服务层与组装层测试，先确认当前实现缺字段而失败**

Run:

```bash
cd modelDesign
mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskServiceAssignmentTimeTest,ProjectTaskViewAssemblerTest test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol
  method getAssigneeAssignedAt()
```

- [ ] **Step 3: 添加数据库迁移和实体字段，先打通持久化层**

```sql
ALTER TABLE "projectTask"
    ADD COLUMN IF NOT EXISTS "assigneeAssignedAt" timestamp;

UPDATE "projectTask"
SET "assigneeAssignedAt" = CASE
    WHEN "assigneeId" IS NULL OR "assigneeId" = 0 THEN NULL
    ELSE "updateTime"
END
WHERE "assigneeAssignedAt" IS NULL;
```

```java
/**
 * 当前负责人最近一次被指派时间。
 */
private LocalDateTime assigneeAssignedAt;
```

- [ ] **Step 4: 在 `ProjectTaskService.java` 中注入支持类，并在创建与编辑链路维护字段**

```java
private final ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport;

@Transactional(rollbackFor = Exception.class)
public ProjectTaskDetailVo create(ProjectTaskCreateRequest request) {
    LocalDateTime now = LocalDateTime.now();
    ProjectTask task = new ProjectTask();
    task.setProjectId(request.getProjectId());
    task.setParentTaskId(request.getParentTaskId());
    task.setTitle(request.getTitle().trim());
    task.setDescription(projectTaskGuardService.normalizeDescription(request.getDescription()));
    task.setStatus(status);
    task.setPriority(request.getPriority().trim());
    task.setWorkDays(request.getWorkDays());
    task.setCreatorId(currentUser.getUserId());
    task.setAssigneeId(request.getAssigneeId());
    task.setAssigneeAssignedAt(
            projectTaskTimeMetricsSupport.resolveAssigneeAssignedAtOnCreate(
                    request.getAssigneeId(),
                    now
            )
    );
    task.setStartTime(request.getStartTime());
    task.setDueTime(request.getDueTime());
    task.setDeleted(0);
    save(task);
    return projectTaskViewAssembler.toTaskVo(task);
}

private void applyTaskUpdate(ProjectTask task,
                             ProjectTaskEditRequest request,
                             String status,
                             Long parentTaskId) {
    LocalDateTime now = LocalDateTime.now();
    task.setParentTaskId(parentTaskId);
    task.setTitle(request.getTitle().trim());
    task.setDescription(projectTaskGuardService.normalizeDescription(request.getDescription()));
    task.setStatus(status);
    task.setPriority(request.getPriority().trim());
    task.setWorkDays(request.getWorkDays());
    task.setAssigneeAssignedAt(
            projectTaskTimeMetricsSupport.resolveAssigneeAssignedAtOnEdit(
                    task.getAssigneeId(),
                    request.getAssigneeId(),
                    task.getAssigneeAssignedAt(),
                    now
            )
    );
    task.setAssigneeId(request.getAssigneeId());
    task.setStartTime(request.getStartTime());
    task.setDueTime(request.getDueTime());
}

private ProjectTask copyTask(ProjectTask source) {
    ProjectTask target = new ProjectTask();
    target.setId(source.getId());
    target.setAssigneeId(source.getAssigneeId());
    target.setAssigneeAssignedAt(source.getAssigneeAssignedAt());
    target.setCreateTime(source.getCreateTime());
    target.setUpdateTime(source.getUpdateTime());
    return target;
}
```

- [ ] **Step 5: 在 `ProjectTaskDetailVo.java` 和 `ProjectTaskViewAssembler.java` 中组装新字段**

```java
@Schema(description = "负责人最近一次被指派时间")
private String assigneeAssignedAt;

@Schema(description = "负责人被指派至今天数")
private Integer assigneeElapsedDays;

@Schema(description = "任务创建至今天数")
private Integer createdElapsedDays;
```

```java
private final ProjectTaskTimeMetricsSupport projectTaskTimeMetricsSupport;

public List<ProjectTaskDetailVo> toTaskVoList(List<ProjectTask> tasks) {
    LocalDateTime now = LocalDateTime.now();
    List<ProjectTaskDetailVo> result = new ArrayList<>();
    for (ProjectTask task : tasks) {
        result.add(ProjectTaskDetailVo.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .projectCode(projectCodeMap.getOrDefault(task.getProjectId(), ""))
                .assigneeId(task.getAssigneeId())
                .assignee(resolveUserNickname(userMap.get(task.getAssigneeId())))
                .assigneeAssignedAt(formatDateTime(task.getAssigneeAssignedAt()))
                .assigneeElapsedDays(
                        projectTaskTimeMetricsSupport.calculateElapsedDays(
                                task.getAssigneeAssignedAt(),
                                now
                        )
                )
                .createdElapsedDays(
                        projectTaskTimeMetricsSupport.calculateElapsedDays(
                                task.getCreateTime(),
                                now
                        )
                )
                .createdAt(formatDateTime(task.getCreateTime()))
                .updatedAt(formatDateTime(task.getUpdateTime()))
                .build());
    }
    return result;
}
```

- [ ] **Step 6: 扩充 `ProjectTaskViewAssemblerTest.java`，断言三个新增字段都被正确返回**

```java
task.setAssigneeId(99L);
task.setAssigneeAssignedAt(LocalDateTime.now().minusDays(2));
task.setCreateTime(LocalDateTime.now().minusDays(5));

List<ProjectTaskDetailVo> result = assembler.toTaskVoList(List.of(task));

assertEquals(1, result.size());
assertEquals("TASK", result.get(0).getProjectCode());
assertEquals(2, result.get(0).getAssigneeElapsedDays());
assertEquals(5, result.get(0).getCreatedElapsedDays());
assertEquals(
        "2026-04-06 00:00:00",
        result.get(0).getAssigneeAssignedAt()
);
```

- [ ] **Step 7: 运行后端目标测试，确认迁移规则、服务写入和 VO 组装全部通过**

Run:

```bash
cd modelDesign
mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskTimeMetricsSupportTest,ProjectTaskServiceAssignmentTimeTest,ProjectTaskViewAssemblerTest test
```

Expected:

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

- [ ] **Step 8: 提交后端任务时长字段能力**

```bash
git add modelDesign/boot/src/main/resources/db/migration/V1.20260408110000__mod_project_task_assignee_assigned_at.sql \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTask.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskViewAssembler.java \
  modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDetailVo.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskServiceAssignmentTimeTest.java \
  modelDesign/mod-project/mod-project-biz/src/test/java/io/github/modelDesign/project/service/ProjectTaskViewAssemblerTest.java
git commit -m "feat: #0 增加任务指派与创建时长字段"
```

### Task 3: 替换敏捷面板卡片的元信息展示

**Files:**
- Modify: `admin-rsbuild/src/api/modules/project-task.types.ts`
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.types.ts`
- Modify: `admin-rsbuild/src/components/business/task-card/TaskCard.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts`
- Modify/Test: `admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx`
- Modify/Test: `admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts`

- [ ] **Step 1: 先写前端失败测试，锁定卡片不再显示截止时间并展示新时长**

```tsx
const baseTask: TaskCardTask = {
  id: 101,
  taskNumber: 'TASK-101',
  projectName: '火星项目',
  title: '补充任务时长字段',
  priority: 'high',
  assignee: '小王',
  assigneeElapsedDays: 3,
  createdElapsedDays: 8,
  workDays: 2,
};

it('展示指派与创建时长，不再展示截止时间', () => {
  render(<TaskCard task={baseTask} />);

  expect(screen.getByText('指派 3 天')).toBeTruthy();
  expect(screen.getByText('创建 8 天')).toBeTruthy();
  expect(screen.queryByText('截止 2026-04-06')).toBeNull();
});

it('未分配负责人时指派时长显示为短横线', () => {
  render(
    <TaskCard
      task={{
        ...baseTask,
        assignee: undefined,
        assigneeElapsedDays: undefined,
      }}
    />,
  );

  expect(screen.getByText('指派 -')).toBeTruthy();
});
```

```ts
it('映射看板任务时透传指派与创建时长字段', () => {
  const task: AgileBoardTask = {
    id: 9,
    projectId: 1,
    title: '映射任务时长',
    status: 'todo',
    priority: 'medium',
    assigneeElapsedDays: 4,
    createdElapsedDays: 9,
  };

  expect(mapAgileBoardTaskToTaskCardTask(task)).toMatchObject({
    assigneeElapsedDays: 4,
    createdElapsedDays: 9,
  });
});
```

- [ ] **Step 2: 运行卡片与适配器测试，确认当前实现先失败**

Run:

```bash
pnpm --dir admin-rsbuild test:run \
  src/components/business/task-card/__tests__/TaskCard.test.tsx \
  src/routes/agile-board/__tests__/taskCardAdapter.test.ts
```

Expected:

```text
FAIL
Unable to find an element with the text: 指派 3 天
```

- [ ] **Step 3: 更新前端类型，让接口模型和通用卡片模型都消费新增字段**

```ts
export interface ProjectTaskDetail {
  id: number;
  projectId: number;
  title: string;
  status: TaskStatusCode;
  priority: TaskPriority;
  assigneeId?: number;
  assignee?: string;
  assigneeAssignedAt?: string;
  assigneeElapsedDays?: number;
  createdElapsedDays: number;
  createdAt?: string;
  updatedAt?: string;
}
```

```ts
export interface TaskCardTask {
  id: number;
  taskNumber?: string;
  projectName?: string;
  title: string;
  priority: TaskPriority;
  workDays?: number;
  assignee?: string;
  assigneeElapsedDays?: number;
  createdElapsedDays: number;
}
```

- [ ] **Step 4: 在 `TaskCard.tsx` 中删除截止时间 helper，新增时长 helper 和元信息渲染**

```tsx
function getTaskAssigneeElapsedText(task: TaskCardTask) {
  if (task.assigneeElapsedDays === undefined || task.assigneeElapsedDays === null) {
    return '指派 -';
  }

  return `指派 ${task.assigneeElapsedDays} 天`;
}

function getTaskCreatedElapsedText(task: TaskCardTask) {
  return `创建 ${task.createdElapsedDays} 天`;
}

const assigneeElapsedText = getTaskAssigneeElapsedText(props.task);
const createdElapsedText = getTaskCreatedElapsedText(props.task);

metaNode = (
  <TaskMetaList>
    {metaProjectNode}
    <TaskMetaText type="secondary">{workDaysText}</TaskMetaText>
    <Tooltip title={assigneeText}>
      <TaskMetaText type="secondary">{assigneeText}</TaskMetaText>
    </Tooltip>
    <TaskMetaText type="secondary">{assigneeElapsedText}</TaskMetaText>
    <TaskMetaText type="secondary">{createdElapsedText}</TaskMetaText>
  </TaskMetaList>
);
```

- [ ] **Step 5: 在 `#taskCardAdapter.ts` 中透传后端返回的时长字段**

```ts
export function mapAgileBoardTaskToTaskCardTask(
  task: AgileBoardTask,
): TaskCardTask {
  return {
    id: task.id,
    taskNumber: resolveTaskNumber(task),
    projectName: normalizeTaskText(task.projectName),
    title: task.title,
    priority: task.priority,
    workDays: task.workDays,
    assignee: normalizeTaskText(task.assignee),
    assigneeElapsedDays: task.assigneeElapsedDays ?? undefined,
    createdElapsedDays: task.createdElapsedDays,
  };
}
```

- [ ] **Step 6: 运行卡片与适配器测试，确认展示和映射逻辑转绿**

Run:

```bash
pnpm --dir admin-rsbuild test:run \
  src/components/business/task-card/__tests__/TaskCard.test.tsx \
  src/routes/agile-board/__tests__/taskCardAdapter.test.ts
```

Expected:

```text
✓ 展示指派与创建时长，不再展示截止时间
✓ 未分配负责人时指派时长显示为短横线
✓ 映射看板任务时透传指派与创建时长字段
```

- [ ] **Step 7: 提交敏捷面板卡片展示调整**

```bash
git add admin-rsbuild/src/api/modules/project-task.types.ts \
  admin-rsbuild/src/components/business/task-card/TaskCard.types.ts \
  admin-rsbuild/src/components/business/task-card/TaskCard.tsx \
  admin-rsbuild/src/components/business/task-card/__tests__/TaskCard.test.tsx \
  admin-rsbuild/src/routes/agile-board/#taskCardAdapter.ts \
  admin-rsbuild/src/routes/agile-board/__tests__/taskCardAdapter.test.ts
git commit -m "feat: #0 调整敏捷面板任务卡片时长信息"
```

### Task 4: 替换任务预览抽屉概要区并做端到端回归

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board/#helper.ts`
- Modify: `admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx`
- Create/Test: `admin-rsbuild/src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx`

- [ ] **Step 1: 先写抽屉测试，锁定“移除截止时间并新增三个字段”**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiProjectTask } from '@/api';
import { drawerContext } from '@/components/KDrawer/Drawer.tsx';
import TaskPreviewDrawer from '../#TaskPreviewDrawer';

vi.mock('@/api', () => ({
  ApiProjectTask: {
    getDetail: vi.fn(),
    edit: vi.fn(),
  },
}));

it('排期与责任区展示指派时间与时长，不再显示截止时间', async () => {
  vi.mocked(ApiProjectTask.getDetail).mockResolvedValue({
    id: 1,
    projectId: 8,
    title: '任务详情字段替换',
    status: 'todo',
    priority: 'medium',
    assignee: '小王',
    assigneeAssignedAt: '2026-04-05 10:00:00',
    assigneeElapsedDays: 3,
    createdElapsedDays: 8,
    createdAt: '2026-03-31 10:00:00',
    updatedAt: '2026-04-08 10:00:00',
  });

  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <drawerContext.Provider value={{ close: vi.fn() } as never}>
        <TaskPreviewDrawer
          taskId={1}
          statusConfigs={[]}
          onEdit={vi.fn()}
          onTaskUpdated={vi.fn()}
        />
      </drawerContext.Provider>
    </QueryClientProvider>,
  );

  expect(await screen.findByText('指派时间')).toBeTruthy();
  expect(screen.getByText('2026-04-05 10:00:00')).toBeTruthy();
  expect(screen.getByText('3 天')).toBeTruthy();
  expect(screen.getByText('8 天')).toBeTruthy();
  expect(screen.queryByText('截止时间')).toBeNull();
});
```

- [ ] **Step 2: 运行抽屉测试，确认当前概要区仍依赖截止时间而失败**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx
```

Expected:

```text
FAIL
Expected element not found: 指派时间
```

- [ ] **Step 3: 在 `#helper.ts` 中补充抽屉展示文案 helper，并删掉不再使用的截止时间 helper**

```ts
export function getTaskAssigneeAssignedAtText(task: AgileBoardTask) {
  if (!task.assigneeAssignedAt) {
    return '-';
  }

  return task.assigneeAssignedAt;
}

export function getTaskAssigneeElapsedDaysText(task: AgileBoardTask) {
  if (task.assigneeElapsedDays === undefined || task.assigneeElapsedDays === null) {
    return '-';
  }

  return `${task.assigneeElapsedDays} 天`;
}

export function getTaskCreatedElapsedDaysText(task: AgileBoardTask) {
  return `${task.createdElapsedDays} 天`;
}
```

- [ ] **Step 4: 修改 `#TaskPreviewDrawer.tsx` 的“排期与责任”区块，替换掉截止时间**

```tsx
import {
  buildBoardEditPayload,
  buildBoardStatusOptions,
  getBoardStatusText,
  getTaskAssigneeAssignedAtText,
  getTaskAssigneeElapsedDaysText,
  getTaskAssigneeText,
  getTaskCreatedElapsedDaysText,
  getTaskPriorityText,
  getTaskProjectText,
  getTaskWorkDaysText,
} from './#helper';

{
  key: 'assigneeAssignedAt',
  label: '指派时间',
  children: getTaskAssigneeAssignedAtText(taskDetail),
},
{
  key: 'assigneeElapsedDays',
  label: '指派至今',
  children: getTaskAssigneeElapsedDaysText(taskDetail),
},
{
  key: 'createdElapsedDays',
  label: '创建至今',
  children: getTaskCreatedElapsedDaysText(taskDetail),
},
{
  key: 'creator',
  label: '创建人',
  children: taskDetail.creator || '-',
},
```

- [ ] **Step 5: 运行抽屉测试和完整敏捷面板前端测试组，确认没有旧字段回归**

Run:

```bash
pnpm --dir admin-rsbuild test:run \
  src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx \
  src/components/business/task-card/__tests__/TaskCard.test.tsx \
  src/routes/agile-board/__tests__/taskCardAdapter.test.ts \
  src/routes/agile-board/__tests__/AgileBoardTaskCard.test.tsx \
  src/routes/agile-board/__tests__/BoardColumn.test.tsx
```

Expected:

```text
PASS
All 5 test files passed
```

- [ ] **Step 6: 再跑一次后端与前端关键验证，确认跨端口径都稳定**

Run:

```bash
cd modelDesign
mvn -pl mod-project/mod-project-biz -Dtest=ProjectTaskTimeMetricsSupportTest,ProjectTaskServiceAssignmentTimeTest,ProjectTaskViewAssemblerTest test
cd ..
pnpm --dir admin-rsbuild test:run \
  src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx \
  src/components/business/task-card/__tests__/TaskCard.test.tsx \
  src/routes/agile-board/__tests__/taskCardAdapter.test.ts
```

Expected:

```text
BUILD SUCCESS
PASS
```

- [ ] **Step 7: 提交抽屉与最终回归调整**

```bash
git add admin-rsbuild/src/routes/agile-board/#helper.ts \
  admin-rsbuild/src/routes/agile-board/#TaskPreviewDrawer.tsx \
  admin-rsbuild/src/routes/agile-board/__tests__/TaskPreviewDrawer.test.tsx
git commit -m "feat: #0 调整敏捷面板任务预览时长字段"
```
