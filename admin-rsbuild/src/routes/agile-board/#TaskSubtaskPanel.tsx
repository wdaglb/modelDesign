import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Input,
  Skeleton,
  Space,
  Typography,
  message,
} from 'antd';

import { ApiProjectTask } from '@/api';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail, TaskStatusCode } from '@/api/modules/project-task.types';
import queryKey from '@/constants/queryKey';

import {
  getBoardStatusText,
  getTaskAssigneeText,
  buildAgileBoardTaskShareUrl,
  copyTextToClipboard,
  resolveTaskNumberText,
} from './#helper';
import TaskPreviewSection from './#TaskPreviewSection';

interface TaskSubtaskPanelProps {
  /**
   * 父任务详情。
   */
  parentTask: ProjectTaskDetail;

  /**
   * 当前任务状态配置。
   */
  statusConfigs: TaskStatusConfig[];

  /**
   * 创建成功后用于刷新外层数据。
   */
  onRefresh: () => Promise<void>;

  /**
   * 打开指定任务进行补充编辑。
   */
  onEditTask: (task: ProjectTaskDetail) => Promise<void>;
}

/**
 * 子任务面板，负责子任务快捷创建、列表查看与补充详情入口。
 */
const TaskSubtaskPanel = (props: TaskSubtaskPanelProps) => {
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number>();

  const subtaskQuery = useQuery({
    queryKey: queryKey.project.taskChildren(props.parentTask.id),
    queryFn: () => {
      return ApiProjectTask.getChildren(props.parentTask.id);
    },
  });

  /**
   * 当前状态配置没有显式起始标记时，按 sort 升序取第一个状态作为回退。
   */
  const initialSubtaskStatus = useMemo(() => {
    return resolveInitialSubtaskStatus(props.statusConfigs);
  }, [props.statusConfigs]);

  const completedStatusSet = useMemo(() => {
    const statusSet = new Set<TaskStatusCode>();

    props.statusConfigs.forEach((statusConfig) => {
      if (statusConfig.isCompleted) {
        statusSet.add(statusConfig.code);
      }
    });

    return statusSet;
  }, [props.statusConfigs]);

  const completedCount = useMemo(() => {
    const children = subtaskQuery.data ?? [];
    return children.filter((item) => completedStatusSet.has(item.status)).length;
  }, [completedStatusSet, subtaskQuery.data]);

  const totalCount = subtaskQuery.data?.length ?? 0;
  const canCreate = Boolean(title.trim()) && Boolean(initialSubtaskStatus) && !creating;

  const handleQuickCreate = async () => {
    if (!canCreate || !initialSubtaskStatus) {
      return;
    }

    setCreating(true);

    try {
      await ApiProjectTask.create({
        projectId: props.parentTask.projectId,
        parentTaskId: props.parentTask.id,
        title: title.trim(),
        status: initialSubtaskStatus,
        priority: props.parentTask.priority,
        assigneeId: props.parentTask.assigneeId,
      });

      setTitle('');
      message.success('子任务创建成功');
      await Promise.all([subtaskQuery.refetch(), props.onRefresh()]);
    } catch (error) {
      message.error('子任务创建失败，请稍后重试');
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubtask = async (taskId: number) => {
    setEditingTaskId(taskId);

    try {
      const detailTask = await ApiProjectTask.getDetail(taskId);
      await props.onEditTask(detailTask);
      await Promise.all([subtaskQuery.refetch(), props.onRefresh()]);
    } finally {
      setEditingTaskId(undefined);
    }
  };

  /**
   * 复制子任务编号，方便与敏捷面板卡片保持一致的分享动作。
   *
   * @param task 子任务详情
   */
  const handleCopyTaskNumber = async (task: ProjectTaskDetail) => {
    try {
      await copyTextToClipboard(resolveTaskNumberText(task));
      message.success('任务编号已复制');
    } catch {
      message.error('任务编号复制失败，请稍后重试');
    }
  };

  /**
   * 复制子任务分享链接，便于直接打开任务详情抽屉。
   *
   * @param task 子任务详情
   */
  const handleCopyTaskLink = async (task: ProjectTaskDetail) => {
    try {
      await copyTextToClipboard(
        buildAgileBoardTaskShareUrl(task, window.location.origin),
      );
      message.success('任务链接已复制');
    } catch {
      message.error('任务链接复制失败，请稍后重试');
    }
  };

  return (
    <Space
      orientation={'vertical'}
      size={12}
      style={{ width: '100%' }}
      styles={{ item: { width: '100%' } }}
    >
      <TaskPreviewSection title={'快捷创建'}>
        <Space orientation={'vertical'} size={10} style={{ width: '100%' }}>
          <Space.Compact block>
            <Input
              value={title}
              disabled={creating}
              placeholder={'输入子任务标题后回车创建'}
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              onPressEnter={async () => {
                await handleQuickCreate();
              }}
            />
            <Button
              type={'primary'}
              loading={creating}
              disabled={!canCreate}
              onClick={async () => {
                await handleQuickCreate();
              }}
            >
              添加
            </Button>
          </Space.Compact>

          <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
            默认继承父任务负责人，可创建后继续补充详情。
          </Typography.Text>
        </Space>
      </TaskPreviewSection>

      <TaskPreviewSection title={'子任务列表'}>
        <Space orientation={'vertical'} size={12} style={{ width: '100%' }}>
          <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
            已完成 {completedCount} / {totalCount}
          </Typography.Text>

          {subtaskQuery.isLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : null}

          {subtaskQuery.isError ? (
            <Alert
              type={'error'}
              showIcon
              message={'子任务加载失败，请稍后重试。'}
            />
          ) : null}

          {!subtaskQuery.isLoading && !subtaskQuery.isError && subtaskQuery.data?.length
            ? subtaskQuery.data.map((item) => {
                const taskNumberText = resolveTaskNumberText(item);
                return (
                  <Card
                    key={item.id}
                    size={'small'}
                    styles={{
                      body: {
                        padding: 14,
                      },
                    }}
                  >
                    <Space
                      orientation={'vertical'}
                      size={10}
                      style={{ width: '100%' }}
                      styles={{ item: { width: '100%' } }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <Space orientation={'vertical'} size={4} style={{ minWidth: 0 }}>
                          <Typography.Link
                            style={{
                              fontSize: 12,
                              fontFamily:
                                "'SFMono-Regular', 'Cascadia Code', 'JetBrains Mono', monospace",
                            }}
                            onClick={async () => {
                              await handleCopyTaskNumber(item);
                            }}
                          >
                            {`# ${taskNumberText}`}
                          </Typography.Link>
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </Space>
                        <Space size={0}>
                          <Button
                            type={'link'}
                            size={'small'}
                            onClick={async () => {
                              await handleCopyTaskLink(item);
                            }}
                          >
                            复制链接
                          </Button>
                          <Button
                            size={'small'}
                            loading={editingTaskId === item.id}
                            onClick={async () => {
                              await handleEditSubtask(item.id);
                            }}
                          >
                            补充详情
                          </Button>
                        </Space>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          状态：{getBoardStatusText(item.status, props.statusConfigs)}
                        </Typography.Text>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          负责人：{getTaskAssigneeText(item)}
                        </Typography.Text>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          更新时间：{item.updatedAt || '-'}
                        </Typography.Text>
                      </div>
                    </Space>
                  </Card>
                );
              })
            : null}
        </Space>
      </TaskPreviewSection>
    </Space>
  );
};

/**
 * 解析快捷创建使用的初始状态编码。
 */
function resolveInitialSubtaskStatus(
  statusConfigs: TaskStatusConfig[],
): TaskStatusCode | undefined {
  if (!statusConfigs.length) {
    return undefined;
  }

  const sortedConfigs = [...statusConfigs].sort((a, b) => a.sort - b.sort);
  return sortedConfigs[0]?.code;
}

export default TaskSubtaskPanel;
