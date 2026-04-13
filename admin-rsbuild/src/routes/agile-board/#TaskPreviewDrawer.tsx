import { useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Descriptions,
  Skeleton,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';

import { ApiProjectTask } from '@/api';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  TaskPriority,
  type ProjectTaskDetail,
  type TaskStatusCode,
} from '@/api/modules/project-task.types';
import { drawerContext } from '@/components/KDrawer/Drawer.tsx';
import { KMarkdownPreview } from '@/components';
import queryKey from '@/constants/queryKey';

import {
  buildAgileBoardTaskShareUrl,
  buildBoardEditPayload,
  copyTextToClipboard,
  buildBoardStatusOptions,
  getBoardStatusText,
  getTaskAssigneeText,
  getTaskPriorityText,
  getTaskProjectText,
  resolveTaskNumberText,
  getTaskWorkDaysText,
} from './#helper';
import TaskChangeLogPanel from './#TaskChangeLogPanel';
import TaskPreviewSection from './#TaskPreviewSection';
import TaskPreviewSummary from './#TaskPreviewSummary';
import TaskSubtaskPanel from './#TaskSubtaskPanel';

interface TaskPreviewDrawerProps {
  onEdit: (task: ProjectTaskDetail) => Promise<void>;
  onTaskUpdated: () => Promise<void>;
  statusConfigs: TaskStatusConfig[];
  taskId: number;
}

/**
 * 任务预览抽屉内容。
 */
const TaskPreviewDrawer = (props: TaskPreviewDrawerProps) => {
  const ctx = useContext(drawerContext);
  const queryClient = useQueryClient();
  const [activeTabKey, setActiveTabKey] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusCode>();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const detailQueryKey = useMemo(() => {
    return ['projectTaskDetail', props.taskId];
  }, [props.taskId]);

  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => ApiProjectTask.getDetail(props.taskId),
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    setSelectedStatus(detailQuery.data.status);
  }, [detailQuery.data]);

  const statusOptions = useMemo(() => {
    if (!detailQuery.data) {
      return buildBoardStatusOptions(props.statusConfigs, '');
    }

    return buildBoardStatusOptions(props.statusConfigs, detailQuery.data.status);
  }, [detailQuery.data, props.statusConfigs]);

  const priorityColor = useMemo(() => {
    if (!detailQuery.data) {
      return 'default';
    }

    if (detailQuery.data.priority === TaskPriority.High) {
      return 'red';
    }

    if (detailQuery.data.priority === TaskPriority.Medium) {
      return 'orange';
    }

    return 'blue';
  }, [detailQuery.data]);

  const statusTagColor = useMemo(() => {
    if (!detailQuery.data) {
      return 'default';
    }

    const matchedStatus = props.statusConfigs.find((item) => {
      return item.code === detailQuery.data.status;
    });

    if (!matchedStatus) {
      return 'default';
    }

    if (matchedStatus.isCompleted) {
      return 'green';
    }

    return 'blue';
  }, [detailQuery.data, props.statusConfigs]);

  const handleEdit = async () => {
    if (!detailQuery.data) {
      return;
    }

    await props.onEdit(detailQuery.data);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: detailQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskChangeLog(props.taskId),
      }),
    ]);
  };

  const handleStatusUpdate = async () => {
    if (!detailQuery.data) {
      return;
    }

    if (!selectedStatus) {
      return;
    }

    if (selectedStatus === detailQuery.data.status) {
      return;
    }

    setUpdatingStatus(true);

    try {
      await ApiProjectTask.edit(
        detailQuery.data.id,
        buildBoardEditPayload(detailQuery.data, {
          status: selectedStatus,
        }),
      );
      message.success('任务状态已更新');
      await Promise.all([
        props.onTaskUpdated(),
        queryClient.invalidateQueries({
          queryKey: detailQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKey.project.taskChangeLog(props.taskId),
        }),
      ]);
    } finally {
      setUpdatingStatus(false);
    }
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
          type="error"
          showIcon
          message="任务详情加载失败，请稍后重试。"
        />
      </div>
    );
  }

  const taskDetail = detailQuery.data;
  const statusText = getBoardStatusText(taskDetail.status, props.statusConfigs);
  const taskNumberText = resolveTaskNumberText(taskDetail);
  const canApplyStatus =
    Boolean(selectedStatus) && selectedStatus !== taskDetail.status;
  const taskShareUrl = buildAgileBoardTaskShareUrl(
    taskDetail,
    window.location.origin,
  );

  /**
   * 详情抽屉与编辑表单复用同一套 Markdown 预览风格，减少阅读落差。
   */
  let descriptionContent = (
    <Typography.Text type="secondary">暂无描述</Typography.Text>
  );
  if (taskDetail.description) {
    descriptionContent = (
      <KMarkdownPreview value={taskDetail.description} />
    );
  }

  /**
   * 复制当前任务编号，便于与卡片区保持一致的交互体验。
   */
  const handleCopyTaskNumber = async () => {
    try {
      await copyTextToClipboard(taskNumberText);
      message.success('任务编号已复制');
    } catch {
      message.error('任务编号复制失败，请稍后重试');
    }
  };

  /**
   * 复制当前任务分享链接，便于他人直达当前任务详情。
   */
  const handleCopyTaskLink = async () => {
    try {
      await copyTextToClipboard(taskShareUrl);
      message.success('任务链接已复制');
    } catch {
      message.error('任务链接复制失败，请稍后重试');
    }
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#f7f9fc',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: 20,
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <TaskPreviewSummary
          title={taskDetail.title}
          projectText={getTaskProjectText(taskDetail)}
          priorityText={getTaskPriorityText(taskDetail.priority)}
          priorityColor={priorityColor}
          statusText={statusText}
          statusTagColor={statusTagColor}
          taskNumberText={taskNumberText}
          selectedStatus={selectedStatus}
          statusOptions={statusOptions}
          updatingStatus={updatingStatus}
          canApplyStatus={canApplyStatus}
          onStatusChange={(value) => {
            setSelectedStatus(value);
          }}
          onApplyStatus={handleStatusUpdate}
          onCopyTaskLink={handleCopyTaskLink}
          onCopyTaskNumber={handleCopyTaskNumber}
          onEdit={handleEdit}
          onClose={() => {
            ctx.close();
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <Tabs
          activeKey={activeTabKey}
          items={[
            {
              key: 'overview',
              label: '概览',
              children: (
                <Space
                  orientation="vertical"
                  size={12}
                  style={{ width: '100%' }}
                  styles={{ item: { width: '100%' } }}
                >
                  <TaskPreviewSection title="任务进度">
                    <Descriptions
                      size="small"
                      column={1}
                      items={[
                        {
                          key: 'status',
                          label: '当前状态',
                          children: statusText,
                        },
                        {
                          key: 'priority',
                          label: '优先级',
                          children: getTaskPriorityText(taskDetail.priority),
                        },
                        {
                          key: 'workDays',
                          label: '预计工时',
                          children: getTaskWorkDaysText(taskDetail),
                        },
                      ]}
                    />
                  </TaskPreviewSection>

                  <TaskPreviewSection title="排期与责任">
                    <Descriptions
                      size="small"
                      column={1}
                      items={[
                        {
                          key: 'assignee',
                          label: '负责人',
                          children: getTaskAssigneeText(taskDetail),
                        },
                        {
                          key: 'startTime',
                          label: '开始时间',
                          children: taskDetail.startTime || '-',
                        },
                        {
                          key: 'dueTime',
                          label: '截止时间',
                          children: taskDetail.dueTime || '-',
                        },
                        {
                          key: 'creator',
                          label: '创建人',
                          children: taskDetail.creator || '-',
                        },
                        {
                          key: 'updatedAt',
                          label: '更新时间',
                          children: taskDetail.updatedAt || '-',
                        },
                      ]}
                    />
                  </TaskPreviewSection>

                  <TaskPreviewSection title="任务说明">
                    {descriptionContent}
                  </TaskPreviewSection>
                </Space>
              ),
            },
            {
              key: 'subtask',
              label: '子任务',
              children: (
                <TaskSubtaskPanel
                  parentTask={taskDetail}
                  statusConfigs={props.statusConfigs}
                  onRefresh={async () => {
                    await Promise.all([
                      props.onTaskUpdated(),
                      queryClient.invalidateQueries({
                        queryKey: detailQueryKey,
                      }),
                    ]);
                  }}
                  onEditTask={props.onEdit}
                />
              ),
            },
            {
              key: 'changeLog',
              label: '变更日志',
              children: (
                <TaskChangeLogPanel
                  active={activeTabKey === 'changeLog'}
                  taskId={props.taskId}
                />
              ),
            },
          ]}
          onChange={(nextKey) => {
            setActiveTabKey(nextKey);
          }}
        />
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(15, 23, 42, 0.06)',
          background: '#ffffff',
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          侧栏用于快速查看与流转任务，完整字段编辑仍通过任务表单完成。
        </Typography.Text>
      </div>
    </div>
  );
};

export default TaskPreviewDrawer;
