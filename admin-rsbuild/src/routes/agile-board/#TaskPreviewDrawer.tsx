import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Skeleton } from 'antd';

import { ApiProjectTask } from '@/api';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import { useKDrawer } from '@/components/KDrawer';
import queryKey from '@/constants/queryKey';
import TaskEditForm from '@/routes/project/components/#TaskEditForm';

import TaskDetailView from './#TaskDetailView';
import type { TaskPreviewDrawerTabKey } from './#previewDrawerService';

interface TaskPreviewDrawerProps {
  /**
   * 抽屉首次打开时默认激活的 Tab。
   */
  initialTabKey?: TaskPreviewDrawerTabKey;
  onEdit: (task: ProjectTaskDetail) => Promise<void>;
  onTaskUpdated: () => Promise<void>;
  statusConfigs: TaskStatusConfig[];
  taskId: number;
}

type DrawerMode = 'view' | 'edit';

/**
 * 任务详情抽屉容器。
 *
 * 这个容器只负责三件事：
 * 1. 拉取并刷新任务详情；
 * 2. 维护查看态 / 编辑态切换；
 * 3. 把保存后的刷新责任集中到一个地方。
 */
const TaskPreviewDrawer = (props: TaskPreviewDrawerProps) => {
  const drawer = useKDrawer();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<DrawerMode>('view');

  const detailQueryKey = useMemo(() => {
    return ['projectTaskDetail', props.taskId];
  }, [props.taskId]);

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => ApiProjectTask.getDetail(props.taskId),
  });

  useEffect(() => {
    setMode('view');
  }, [props.taskId]);

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
    setMode('view');
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
      title: '任务详情',
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
          statusConfigs={props.statusConfigs}
          onTaskUpdated={handleTaskMutated}
          onEdit={props.onEdit}
        />
      ),
    });
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

  if (mode === 'edit') {
    return (
      <TaskEditForm
        mode={'drawer'}
        task={detailQuery.data}
        statusConfigs={props.statusConfigs}
        onCancel={() => {
          setMode('view');
        }}
        onSuccess={handleTaskMutated}
        onOpenFullEdit={props.onEdit}
      />
    );
  }

  return (
    <TaskDetailView
      task={detailQuery.data}
      statusConfigs={props.statusConfigs}
      initialTabKey={props.initialTabKey}
      onEnterEdit={() => {
        setMode('edit');
      }}
      onTaskUpdated={handleTaskMutated}
      onEditTask={openNestedTaskPreviewDrawer}
    />
  );
};

export default TaskPreviewDrawer;
