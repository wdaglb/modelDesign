# Task Auto Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为敏捷面板和我的待办增加 10 秒静默定时刷新，并确保敏捷面板在拖拽、编辑弹窗、预览抽屉期间暂停，结束后立即补刷。

**Architecture:** 新增一个轻量级 `useAutoRefresh` Hook，统一封装定时调度、暂停恢复、恢复补刷和卸载清理；敏捷面板页面直接把当前任务列表刷新函数接入 Hook，我的待办页面通过当前表格查询键触发静默刷新，避免把本次需求扩散成 `KTable` 组件改造。

**Tech Stack:** React 18、TypeScript、TanStack Query、Ant Design、TanStack Router、项目现有 `KTable`

---

## 文件结构与职责

### 新增文件

- `admin-rsbuild/src/hooks/useAutoRefresh.ts`
  - 统一封装自动刷新调度
  - 接收刷新函数、暂停状态、刷新间隔
  - 处理暂停恢复后的立即补刷
  - 处理组件卸载时的定时器清理

### 修改文件

- `admin-rsbuild/src/routes/agile-board.tsx`
  - 接入 `useAutoRefresh`
  - 将敏捷面板暂停条件统一收敛到页面层
  - 只对当前面板任务列表执行静默刷新
  - 保留用户主动编辑后的 `invalidateBoardQueries()` 联动行为

- `admin-rsbuild/src/routes/my-todo/#TodoTable.tsx`
  - 接入 `useAutoRefresh`
  - 复用当前待办列表查询键进行静默刷新
  - 保持分页、搜索、筛选状态不被轮询重置

### 不改动文件

- `admin-rsbuild/src/components/KTable/index.tsx`
- `admin-rsbuild/src/components/KTable/types.ts`
- 后端接口模块

原因说明：

- 本次需求边界明确落在两个页面
- `KTable` 当前 `refresh()` 没有被设计为统一轮询入口
- 若强行改造 `KTable`，会把小范围页面需求放大为公共组件改造

## 实施约束

- 按仓库规范，本次实施不执行命令验证
- 验证方式以静态核查点和页面交互走查要点为主
- 所有新增注释使用 `/** */`
- 不使用三元表达式
- 若单个文件新增逻辑接近 400 行，需要优先抽离辅助函数或 Hook

## Task 1: 新增自动刷新 Hook

**Files:**
- Create: `admin-rsbuild/src/hooks/useAutoRefresh.ts`

- [ ] **Step 1: 新建 Hook 文件并声明参数类型**

```ts
import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /**
   * 实际执行刷新的函数。
   *
   * 调用方可以传入同步函数，也可以传入返回 Promise 的异步函数。
   */
  refresh: () => void | Promise<unknown>;

  /**
   * 当前是否暂停自动刷新。
   */
  paused?: boolean;

  /**
   * 刷新间隔，单位毫秒。
   */
  intervalMs?: number;

  /**
   * 是否在从暂停恢复后立即补刷一次。
   */
  refreshOnResume?: boolean;
}
```

- [ ] **Step 2: 实现 Hook 主体，封装调度、并发保护和恢复补刷**

```ts
const useAutoRefresh = (options: UseAutoRefreshOptions) => {
  const {
    refresh,
    paused = false,
    intervalMs = 10000,
    refreshOnResume = true,
  } = options;
  const refreshRef = useRef(refresh);
  const pausedRef = useRef(paused);
  const timerRef = useRef<number>();
  const isRefreshingRef = useRef(false);
  const previousPausedRef = useRef(paused);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const runRefresh = async () => {
      if (pausedRef.current) {
        return;
      }

      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;

      try {
        await refreshRef.current();
      } catch (error) {
        /**
         * 自动刷新失败时保持静默，不在 Hook 内处理提示，
         * 由调用方决定是否需要额外记录日志。
         */
      } finally {
        isRefreshingRef.current = false;
      }
    };

    timerRef.current = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    return () => {
      if (timerRef.current !== undefined) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [intervalMs]);

  useEffect(() => {
    if (!refreshOnResume) {
      previousPausedRef.current = paused;
      return;
    }

    if (previousPausedRef.current && !paused) {
      void (async () => {
        if (isRefreshingRef.current) {
          return;
        }

        isRefreshingRef.current = true;

        try {
          await refreshRef.current();
        } catch (error) {
          /**
           * 恢复后的补刷同样保持静默失败策略。
           */
        } finally {
          isRefreshingRef.current = false;
        }
      })();
    }

    previousPausedRef.current = paused;
  }, [paused, refreshOnResume]);
};

export default useAutoRefresh;
```

- [ ] **Step 3: 静态核查 Hook 行为边界**

核查点：

- 是否默认 `10 秒` 轮询
- `paused = true` 时是否完全跳过本轮
- `paused` 从 `true` 回到 `false` 时是否只补刷一次
- 组件卸载时是否清理了定时器
- Hook 内是否没有直接依赖具体业务页面

- [ ] **Step 4: 核对代码风格**

核查点：

- 注释是否使用了 `/** */`
- 是否没有出现三元表达式
- Hook 文件是否保持单一职责

## Task 2: 接入敏捷面板自动刷新

**Files:**
- Modify: `admin-rsbuild/src/routes/agile-board.tsx`
- Create: `admin-rsbuild/src/hooks/useAutoRefresh.ts`

- [ ] **Step 1: 在敏捷面板页面引入 Hook，并补齐弹窗打开态**

```ts
import { useMemo, useState } from 'react';

import useAutoRefresh from '@/hooks/useAutoRefresh';
```

在页面状态区域新增：

```ts
const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
```

- [ ] **Step 2: 从看板查询中取出专用刷新函数**

将当前看板查询由：

```ts
const { data: boardTasks = [] } = useQuery({
  queryKey: [...queryKey.project.taskBoard(), params],
  queryFn: () => ApiProjectTask.getAgileBoard(params),
});
```

调整为：

```ts
const {
  data: boardTasks = [],
  refetch: refetchBoardTasks,
} = useQuery({
  queryKey: [...queryKey.project.taskBoard(), params],
  queryFn: () => ApiProjectTask.getAgileBoard(params),
});
```

- [ ] **Step 3: 汇总敏捷面板暂停条件并接入 Hook**

新增页面级暂停态：

```ts
const isBoardRefreshPaused = useMemo(() => {
  if (activeTaskDragId !== undefined) {
    return true;
  }

  if (previewTaskId !== undefined) {
    return true;
  }

  if (isTaskFormOpen) {
    return true;
  }

  return false;
}, [activeTaskDragId, isTaskFormOpen, previewTaskId]);
```

接入 Hook：

```ts
useAutoRefresh({
  paused: isBoardRefreshPaused,
  intervalMs: 10000,
  refresh: async () => {
    await refetchBoardTasks();
  },
});
```

- [ ] **Step 4: 在任务弹窗打开和关闭时维护暂停状态**

将 `openTaskForm` 调整为：

```ts
const openTaskForm = async (task?: ProjectTaskDetail) => {
  setIsTaskFormOpen(true);

  try {
    const submitted = await openTaskModal(modal, {
      statusConfigs,
      task,
    });

    if (!submitted) {
      return;
    }

    await invalidateBoardQueries();
  } finally {
    setIsTaskFormOpen(false);
  }
};
```

- [ ] **Step 5: 保持预览抽屉和拖拽逻辑与暂停规则一致**

保留现有逻辑，但核查以下关键点：

```ts
setPreviewTaskId(task.id);
setPreviewTaskId(undefined);
setActiveTaskDragId(String(event.active.id));
setActiveTaskDragId(undefined);
```

静态核查点：

- `previewTaskId` 是否在打开抽屉前赋值，在关闭后复位
- `activeTaskDragId` 是否在拖拽开始时赋值，在结束或取消后复位
- 恢复补刷是否由 Hook 自动兜底，无需额外手写第二套逻辑

- [ ] **Step 6: 确认定时刷新不会误用全量失效逻辑**

核查点：

- 自动刷新只调用 `refetchBoardTasks`
- `invalidateBoardQueries()` 仍只用于用户主动操作成功后的联动刷新
- 没有把项目列表和状态配置纳入 `10 秒` 轮询

## Task 3: 接入我的待办自动刷新

**Files:**
- Modify: `admin-rsbuild/src/routes/my-todo/#TodoTable.tsx`
- Create: `admin-rsbuild/src/hooks/useAutoRefresh.ts`

- [ ] **Step 1: 为我的待办补齐 `queryClient` 和表格刷新引用**

将引入调整为：

```ts
import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
```

补充页面级对象：

```ts
const queryClient = useQueryClient();
```

- [ ] **Step 2: 为当前表格查询键单独命名，避免重复拼接**

在 `params` 下方新增：

```ts
const todoQueryKey = useMemo(() => {
  return [...queryKey.todo.list(), params];
}, [params]);
```

并将表格的 `queryKey` 改为：

```ts
queryKey={todoQueryKey}
```

- [ ] **Step 3: 接入 Hook，使用当前查询键执行静默刷新**

新增自动刷新逻辑：

```ts
useAutoRefresh({
  intervalMs: 10000,
  refresh: async () => {
    await queryClient.refetchQueries({
      queryKey: todoQueryKey,
      exact: true,
    });
  },
});
```

这里选择直接使用当前 `queryKey` 调用 `refetchQueries`，原因是：

- 能保证刷新命中当前页、当前筛选、当前分页的查询
- 不需要改动 `KTable` 公共 API
- 仍然符合“页面层接入”的设计边界

- [ ] **Step 4: 静态核查我的待办页面状态稳定性**

核查点：

- 搜索后 `todoQueryKey` 是否使用最新 `title`
- 切换优先级或状态后是否仍使用最新筛选参数
- 分页切换后是否仍指向当前分页参数
- 自动刷新逻辑是否没有重置本地分页状态

## Task 4: 代码自查与交付准备

**Files:**
- Review: `admin-rsbuild/src/hooks/useAutoRefresh.ts`
- Review: `admin-rsbuild/src/routes/agile-board.tsx`
- Review: `admin-rsbuild/src/routes/my-todo/#TodoTable.tsx`

- [ ] **Step 1: 逐条对照 spec 核查覆盖度**

对照 `docs/superpowers/specs/2026-04-02-task-auto-refresh-design.md`，确认：

- 敏捷面板是否按 `10 秒` 静默刷新
- 我的待办是否按 `10 秒` 静默刷新
- 敏捷面板是否在拖拽、编辑、预览时暂停
- 恢复后是否会立即补刷
- 是否没有新增刷新开关和频率配置

- [ ] **Step 2: 静态核查错误处理是否符合“静默失败”要求**

核查点：

- `useAutoRefresh` 内是否吞掉自动刷新异常而不抛出提示
- 页面主动操作的 `message.success()` 和原有失败处理是否保持不变

- [ ] **Step 3: 静态核查代码风格**

核查点：

- 是否没有新增三元表达式
- 是否补充了必要且不过量的 `/** */` 注释
- 修改后的文件职责是否仍清晰
- 如果 `agile-board.tsx` 体积明显继续膨胀，是否需要抽离页面级刷新判定函数

- [ ] **Step 4: 记录人工走查要点**

交付前人工走查清单：

- 敏捷面板静置 10 秒后数据是否刷新
- 打开任务预览时轮询是否暂停
- 关闭任务预览后是否立即补刷
- 打开任务编辑弹窗时轮询是否暂停
- 关闭任务编辑弹窗后是否立即补刷
- 拖拽任务时轮询是否暂停
- 拖拽结束后是否立即补刷
- 我的待办在当前页停留时是否按 10 秒刷新
- 我的待办在筛选后是否仍保持当前筛选结果并按新条件刷新

## 自检结果

### 1. Spec 覆盖

已覆盖以下需求：

- 10 秒静默刷新
- 敏捷面板暂停与恢复补刷
- 我的待办使用当前查询参数刷新
- 不改后端
- 不做全局轮询中心
- 不把范围扩散到 `KTable` 组件改造

### 2. 占位符扫描

本计划未保留 `TODO`、`TBD` 或“后续处理”类占位描述。

### 3. 命名一致性

计划内统一使用以下命名：

- `useAutoRefresh`
- `isTaskFormOpen`
- `isBoardRefreshPaused`
- `refetchBoardTasks`
- `todoQueryKey`

这些命名在后续实施中不得再随意变体，避免出现计划与代码不一致。
