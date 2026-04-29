import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Input,
  Skeleton,
  Space,
  Typography,
  message,
} from 'antd';

import {
  TaskPreviewFullWidth,
  TaskPreviewSubtaskCard,
  TaskPreviewSubtaskHeader,
  TaskPreviewSubtaskList,
  TaskPreviewSubtaskMetaGrid,
  TaskPreviewTaskNumberText,
  TaskPreviewVerticalStack,
} from './styles/task-preview-drawer.styled';

import { ApiProjectTask } from '@/api';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail, TaskStatusCode } from '@/api/modules/project-task.types';
import queryKey from '@/constants/queryKey';
import { copyTextToClipboard } from '@/utils';
import useAuthStore from '@/store/auth.ts';

import {
  getBoardStatusText,
  getTaskAssigneeText,
  buildAgileBoardTaskShareUrl,
  resolveTaskNumberText,
} from './#helper';
import TaskPreviewSection from './#TaskPreviewSection';
import {
  getTaskBranchUnavailableMessage,
  resolveTaskBranchName,
  resolveTaskBranchUnavailableReason,
} from './#taskDetailTypeHelper';

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
  const [visibleSubtaskCount, setVisibleSubtaskCount] = useState(20);
  const currentInfo = useAuthStore((state) => state.currentInfo);

  /**
   * 子任务列表分段渲染首批数量。
   */
  const SUBTASK_INITIAL_VISIBLE_COUNT = 20;

  /**
   * 每次点击加载更多时追加的子任务数量。
   */
  const SUBTASK_LOAD_MORE_COUNT = 20;

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

  /**
   * 当前可见的子任务集合，避免一次性渲染全部子任务卡片。
   */
  const visibleSubtasks = useMemo(() => {
    const allSubtasks = subtaskQuery.data ?? [];

    return allSubtasks.slice(0, visibleSubtaskCount);
  }, [subtaskQuery.data, visibleSubtaskCount]);

  /**
   * 是否还有可继续加载的子任务。
   */
  const hasMoreSubtasks = useMemo(() => {
    const allSubtasks = subtaskQuery.data ?? [];

    return allSubtasks.length > visibleSubtaskCount;
  }, [subtaskQuery.data, visibleSubtaskCount]);

  /**
   * 切换父任务时重置可见数量，保证每次打开抽屉的首屏成本稳定。
   */
  useEffect(() => {
    setVisibleSubtaskCount(SUBTASK_INITIAL_VISIBLE_COUNT);
  }, [props.parentTask.id]);

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

  /**
   * 继续加载更多子任务，分摊单次渲染压力。
   */
  const handleLoadMoreSubtasks = () => {
    setVisibleSubtaskCount((previousCount) => {
      return previousCount + SUBTASK_LOAD_MORE_COUNT;
    });
  };

  return (
    <TaskPreviewVerticalStack>
      <TaskPreviewSection title={'快捷创建'}>
        <TaskPreviewVerticalStack>
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
        </TaskPreviewVerticalStack>
      </TaskPreviewSection>

      <TaskPreviewSection title={'子任务列表'}>
        <TaskPreviewVerticalStack>
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

          {!subtaskQuery.isLoading && !subtaskQuery.isError && visibleSubtasks.length ? (
            <TaskPreviewSubtaskList>
              {visibleSubtasks.map((item) => {
                const taskNumberText = resolveTaskNumberText(item);
                return (
                  <TaskPreviewSubtaskCard key={item.id} size={'small'}>
                    <TaskPreviewVerticalStack>
                      <TaskPreviewSubtaskHeader>
                        <Space orientation={'vertical'} size={4} style={{ minWidth: 0 }}>
                          <Typography.Link
                            onClick={async () => {
                              await handleCopyTaskNumber(item);
                            }}
                          >
                            <TaskPreviewTaskNumberText>
                              {`# ${taskNumberText}`}
                            </TaskPreviewTaskNumberText>
                          </Typography.Link>
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </Space>
                        <Space size={0}>
                          <Button
                            type={'link'}
                            size={'small'}
                            onClick={async () => {
                              const taskBranchName = resolveTaskBranchName(
                                item,
                                currentInfo?.gitUsername,
                              );
                              if (!taskBranchName) {
                                message.warning(
                                  getTaskBranchUnavailableMessage(
                                    resolveTaskBranchUnavailableReason(
                                      item,
                                      currentInfo?.gitUsername,
                                    ),
                                  ),
                                );
                                return;
                              }
                              await copyTextToClipboard(taskBranchName);
                              message.success('任务分支名已复制');
                            }}
                          >
                            获取分支名
                          </Button>
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
                      </TaskPreviewSubtaskHeader>

                      <TaskPreviewSubtaskMetaGrid>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          状态：{getBoardStatusText(item.status, props.statusConfigs)}
                        </Typography.Text>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          负责人：{getTaskAssigneeText(item)}
                        </Typography.Text>
                        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                          更新时间：{item.updatedAt || '-'}
                        </Typography.Text>
                      </TaskPreviewSubtaskMetaGrid>
                    </TaskPreviewVerticalStack>
                  </TaskPreviewSubtaskCard>
                );
              })}
            </TaskPreviewSubtaskList>
          ) : null}

          {!subtaskQuery.isLoading && !subtaskQuery.isError && hasMoreSubtasks ? (
            <TaskPreviewFullWidth>
              <Button
                size={'small'}
                disabled={editingTaskId !== undefined}
                onClick={handleLoadMoreSubtasks}
              >
                加载更多
              </Button>
            </TaskPreviewFullWidth>
          ) : null}
        </TaskPreviewVerticalStack>
      </TaskPreviewSection>
    </TaskPreviewVerticalStack>
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
