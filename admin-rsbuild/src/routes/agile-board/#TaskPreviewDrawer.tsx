import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Skeleton } from 'antd';

import { ApiProjectTask } from '@/api';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import { useKDrawer } from '@/components/KDrawer';
import queryKey from '@/constants/queryKey';

import TaskDetailView from './#TaskDetailView';
import {
  buildTaskPreviewDrawerTitle,
  type TaskPreviewDrawerTabKey,
} from './#previewDrawerService';

interface TaskPreviewDrawerProps {
  /**
   * 抽屉首次打开时默认激活的 Tab。
   */
  initialTabKey?: TaskPreviewDrawerTabKey;
  /**
   * 当前看板已加载的迭代配置。
   *
   * 传入详情视图后用于展示和快捷修改任务迭代，避免详情抽屉重复维护
   * 一套与看板不同步的迭代数据来源。
   */
  iterations?: ProjectTaskIteration[];
  onEdit: (task: ProjectTaskDetail) => Promise<boolean>;
  onTaskUpdated: () => Promise<void>;
  statusConfigs: TaskStatusConfig[];
  taskId: number;
}

/**
 * 任务详情抽屉容器。
 *
 * 这个容器只负责三件事：
 * 1. 拉取并刷新任务详情；
 * 2. 把编辑入口转交统一任务编辑弹窗；
 * 3. 把保存后的刷新责任集中到一个地方。
 */
const TaskPreviewDrawer = (props: TaskPreviewDrawerProps) => {
  const drawer = useKDrawer();
  const queryClient = useQueryClient();

  const detailQueryKey = useMemo(() => {
    return ['projectTaskDetail', props.taskId];
  }, [props.taskId]);

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => ApiProjectTask.getDetail(props.taskId),
  });

  /**
   * 保存成功后统一刷新详情、子任务、变更日志和外层列表。
   */
  const handleTaskMutated = async () => {
    await Promise.all([
      props.onTaskUpdated(),
      queryClient.invalidateQueries({
        queryKey: detailQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskChildren(props.taskId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskChangeLog(props.taskId),
      }),
    ]);
  };

  /**
   * 在当前详情抽屉之上继续打开子任务详情抽屉。
   *
   * 这里不能走完整编辑弹窗，否则会把“查看详情”的动作错误分流到
   * TaskEditForm；同时复用当前刷新回调，保证子任务修改后父任务抽屉
   * 的详情、子任务与变更日志都能同步失效重拉。
   *
   * @param task 子任务详情
   */
  const openNestedTaskPreviewDrawer = async (task: ProjectTaskDetail) => {
    await drawer.open({
      title: buildTaskPreviewDrawerTitle(task.id),
      size: 840,
      styles: {
        body: {
          padding: 0,
          height: '100%',
          overflow: 'hidden',
        },
      },
      children: (
        <TaskPreviewDrawer
          taskId={task.id}
          iterations={props.iterations}
          statusConfigs={props.statusConfigs}
          onTaskUpdated={handleTaskMutated}
          onEdit={props.onEdit}
        />
      ),
    });
  };

  /**
   * 打开统一任务编辑弹窗。
   *
   * 任务详情抽屉只负责查看和刷新，不再内嵌一套编辑表单，避免字段、校验和
   * 保存 payload 在抽屉与任务编辑窗口之间重复维护。
   */
  const openTaskEditModal = async () => {
    if (!detailQuery.data) {
      return;
    }

    const submitted = await props.onEdit(detailQuery.data);
    if (!submitted) {
      return;
    }

    await handleTaskMutated();
  };

  if (detailQuery.isLoading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type={'error'}
          showIcon
          message={'任务详情加载失败，请稍后重试。'}
        />
      </div>
    );
  }

  return (
    <TaskDetailView
      task={detailQuery.data}
      iterations={props.iterations}
      statusConfigs={props.statusConfigs}
      initialTabKey={props.initialTabKey}
      onEnterEdit={openTaskEditModal}
      onTaskUpdated={handleTaskMutated}
      onEditTask={openNestedTaskPreviewDrawer}
    />
  );
};

export default TaskPreviewDrawer;
