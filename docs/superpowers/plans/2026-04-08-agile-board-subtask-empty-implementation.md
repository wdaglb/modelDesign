# 敏捷面板子任务空列表收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `/agile-board` 中父任务没有子任务时不渲染任何子任务区，同时保留整列空态和已有卡片样式不变。

**Architecture:** 在 `BoardColumn` 这个组装层判断当前父任务是否真的存在子任务，只有存在时才挂载 `SubtaskList`。`SubtaskList` 收敛成纯展示组件，删除空数组时的 `Empty` 分支与相关依赖，避免子组件继续承担空态表达职责。

**Tech Stack:** React 18、TypeScript、Ant Design、styled-components、Vitest、Testing Library

---

## 文件结构与职责

- Modify: `admin-rsbuild/src/routes/agile-board/components/BoardColumn.tsx`
  - 在父任务卡片组装层控制是否渲染 `SubtaskList`
- Modify: `admin-rsbuild/src/routes/agile-board/components/SubtaskList.tsx`
  - 删除空态 `Empty` 依赖与空分支，只保留子任务列表渲染
- Modify/Test: `admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx`
  - 补充“无子任务不渲染子任务区”的回归测试，并保留现有空列与卡片样式断言

### Task 1: 收敛空子任务渲染并补齐回归测试

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board/components/BoardColumn.tsx`
- Modify: `admin-rsbuild/src/routes/agile-board/components/SubtaskList.tsx`
- Test: `admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx`

- [ ] **Step 1: 在 `BoardColumn.test.tsx` 先写失败用例，锁定“空子任务不渲染”行为**

```tsx
const childTask = {
  ...parentTask,
  id: 102,
  title: '子任务 A',
} as AgileBoardTask;

it('父任务无子任务时不渲染子任务区', () => {
  const { container } = render(
    <DndContext>
      <BoardColumn
        column={column}
        tasks={[parentTask]}
        subtaskMap={new Map()}
        onPreview={vi.fn()}
        onPriorityChange={vi.fn()}
      />
    </DndContext>,
  );

  expect(container.querySelector('[data-subtask-list="true"]')).toBeNull();
  expect(screen.queryByText('暂无子任务')).toBeNull();
});

it('父任务有子任务时继续渲染子任务区', () => {
  const { container } = render(
    <DndContext>
      <BoardColumn
        column={column}
        tasks={[parentTask]}
        subtaskMap={new Map([[parentTask.id, [childTask]]])}
        onPreview={vi.fn()}
        onPriorityChange={vi.fn()}
      />
    </DndContext>,
  );

  expect(container.querySelector('[data-subtask-list="true"]')).toBeTruthy();
  expect(screen.getByText('子任务 A')).toBeDefined();
});
```

- [ ] **Step 2: 运行新增测试，先确认当前实现会失败**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/routes/agile-board/__tests__/BoardColumn.test.tsx -t "父任务无子任务时不渲染子任务区"
```

Expected:

```text
FAIL
Expected: null
Received: <div data-subtask-list="true">...</div>
```

- [ ] **Step 3: 在 `BoardColumn.tsx` 中把子任务区渲染条件前移到组装层**

```tsx
{props.tasks.map((task) => {
  const subtasks = props.subtaskMap.get(task.id) ?? [];
  let subtaskNode: ReactNode = null;

  if (subtasks.length > 0) {
    subtaskNode = (
      <SubtaskList
        disabled={props.disabled}
        subtasks={subtasks}
        onPreview={props.onPreview}
        onPriorityChange={props.onPriorityChange}
      />
    );
  }

  return (
    <TaskItem key={task.id}>
      <AgileBoardTaskCard
        accentColor={props.column.accentColor}
        task={task}
        disabled={props.disabled}
        onPreview={props.onPreview}
        onPriorityChange={props.onPriorityChange}
      />
      {subtaskNode}
    </TaskItem>
  );
})}
```

- [ ] **Step 4: 在 `SubtaskList.tsx` 中删除空态分支，让组件只负责展示已有子任务**

```tsx
import type { TaskPriority } from '@/api/modules/project-task.types';
import { TaskCard } from '@/components';

import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';
import type { AgileBoardTask } from '../#types';
import {
  SubtaskItem,
  SubtaskListRoot,
} from '../styles/subtask-list.styled';

const SubtaskList = (props: SubtaskListProps) => {
  return (
    <SubtaskListRoot data-subtask-list="true">
      {props.subtasks.map((subtask) => {
        const adaptedTask = mapAgileBoardTaskToTaskCardTask(subtask);

        return (
          <SubtaskItem key={subtask.id}>
            <TaskCard
              task={adaptedTask}
              compact
              isSubtask
              disabled={props.disabled}
              onPreview={async () => {
                await props.onPreview(subtask);
              }}
              onPriorityChange={async (_task, priority) => {
                await props.onPriorityChange(subtask, priority);
              }}
            />
          </SubtaskItem>
        );
      })}
    </SubtaskListRoot>
  );
};
```

- [ ] **Step 5: 运行目标测试文件，确认空列、空子任务和有子任务三种行为都通过**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/routes/agile-board/__tests__/BoardColumn.test.tsx
```

Expected:

```text
✓ 列无数据时展示 Empty 说明
✓ 父任务无子任务时不渲染子任务区
✓ 父任务有子任务时继续渲染子任务区
✓ 父任务卡片保留白底并追加外层强调边框与阴影
```

- [ ] **Step 6: 如测试输出包含样式或查询波动，再跑一次同文件验证结果稳定**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/routes/agile-board/__tests__/BoardColumn.test.tsx
```

Expected:

```text
PASS
4 passed
```

- [ ] **Step 7: 提交本次实现**

```bash
git add admin-rsbuild/src/routes/agile-board/components/BoardColumn.tsx \
  admin-rsbuild/src/routes/agile-board/components/SubtaskList.tsx \
  admin-rsbuild/src/routes/agile-board/__tests__/BoardColumn.test.tsx
git commit -m "fix(敏捷面板): 空子任务时隐藏子任务区"
```
