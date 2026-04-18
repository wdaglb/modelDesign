import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Empty,
  Flex,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiProjectTaskStatus, ApiTodo } from '@/api';
import type { TodoItem } from '@/api/modules/todo.types';
import {
  TodoPriority,
  TodoPriorityLabel,
  TodoPriorityOptions,
  TodoStatus,
  TodoStatusLabel,
  TodoStatusOptions,
} from '@/api/modules/todo.types';
import { KTable } from '@/components';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import useAutoRefresh from '@/hooks/useAutoRefresh';
import { openTaskPreviewDrawer } from '@/routes/agile-board/#previewDrawerService';
import { openTaskModal } from '@/service/taskModalService.tsx';
import useAuthStore from '@/store/auth.ts';

/**
 * 优先级颜色映射。
 */
const priorityColorMap: Record<TodoPriority, string> = {
  [TodoPriority.High]: 'red',
  [TodoPriority.Medium]: 'gold',
  [TodoPriority.Low]: 'blue',
};

/**
 * 状态颜色映射。
 */
const statusColorMap: Record<TodoStatus, string> = {
  [TodoStatus.Todo]: 'orange',
  [TodoStatus.InProgress]: 'blue',
  [TodoStatus.PendingTest]: 'cyan',
  [TodoStatus.PendingRelease]: 'geekblue',
  [TodoStatus.Done]: 'green',
  [TodoStatus.Canceled]: 'default',
};

/**
 * 获取工时展示文案。
 */
const getWorkDaysText = (value?: number) => {
  if (value === undefined || value === null) {
    return '-';
  }

  return `${value} 人天`;
};

/**
 * 我的待办表格。
 */
const TodoTable = () => {
  const drawer = useKDrawer();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority | undefined>();
  const [status, setStatus] = useState<TodoStatus | undefined>();

  /**
   * 详情抽屉依赖状态配置，用于渲染状态文案与切换选项。
   */
  const { data: statusConfigs = [] } = useQuery({
    queryKey: queryKey.project.taskStatusList(),
    queryFn: () => ApiProjectTaskStatus.getList(),
  });

  /**
   * 统一刷新与任务详情相关的查询缓存。
   */
  const refreshTaskRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskList(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
    ]);
  };

  /**
   * 打开任务详情抽屉，并在编辑完成后同步刷新列表。
   */
  const openTodoDetailDrawer = async (task: TodoItem) => {
    try {
      await openTaskPreviewDrawer(drawer, {
        taskId: task.id,
        statusConfigs,
        onTaskUpdated: refreshTaskRelatedQueries,
        onEdit: async (detailTask) => {
          const submitted = await openTaskModal(modal, {
            task: detailTask,
            statusConfigs,
          });

          if (!submitted) {
            return;
          }

          await refreshTaskRelatedQueries();
        },
      });
    } catch (error) {
      if (error === 'KDrawer cancel') {
        return;
      }

      message.error('打开任务详情失败，请稍后重试');
    }
  };

  /**
   * 打开新建任务弹窗并在提交后刷新待办列表。
   */
  const handleCreateTask = async () => {
    try {
      const submitted = await openTaskModal(modal, {
        statusConfigs,
        defaultAssigneeId: currentInfo?.userId,
      });

      if (!submitted) {
        return;
      }

      await refreshTaskRelatedQueries();
    } catch {
      message.error('打开新建任务弹窗失败，请稍后重试');
    }
  };

  /**
   * 列表查询参数。
   *
   * 保持与待办列表接口字段一致；当筛选项为空时不传对应条件。
   */
  const params = useMemo(
    () => ({
      ...pagination,
      title: title.trim() || undefined,
      priority,
      status,
    }),
    [pagination, priority, status, title],
  );
  /**
   * 为当前页面参数生成稳定查询键，确保自动刷新命中当前视图。
   */
  const todoQueryKey = useMemo(() => {
    return [...queryKey.todo.list(), params];
  }, [params]);
  const emptyDescription = useMemo(() => {
    if (title) {
      return '未找到匹配的待办';
    }

    return '暂无待办数据';
  }, [title]);

  useAutoRefresh({
    intervalMs: 10000,
    refresh: async () => {
      await queryClient.refetchQueries({
        queryKey: todoQueryKey,
        exact: true,
      });
    },
  });

  const columns: TableColumnsType<TodoItem> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (value: TodoItem['title']) => (
        <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>
      ),
    },
    {
      title: '接收时间',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 180,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (value: TodoItem['priority']) => (
        <Tag color={priorityColorMap[value]}>{TodoPriorityLabel[value]}</Tag>
      ),
    },
    {
      title: '预计工时（人天）',
      dataIndex: 'workDays',
      key: 'workDays',
      width: 132,
      render: (value: TodoItem['workDays']) => {
        return getWorkDaysText(value);
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: TodoItem['status']) => (
        <Tag color={statusColorMap[value]}>{TodoStatusLabel[value]}</Tag>
      ),
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      key: 'initiatorName',
      width: 140,
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      render: (value: TodoItem['projectName']) => {
        if (!value) {
          return '-';
        }
        return value;
      },
    },
  ];

  return (
    <KTable<TodoItem>
      queryKey={todoQueryKey}
      request={(requestParams) => ApiTodo.getList(requestParams) as Promise<any>}
      params={params}
      columns={columns}
      onRow={(record) => {
        return {
          onClick: () => {
            void openTodoDetailDrawer(record);
          },
          style: {
            cursor: 'pointer',
          },
        };
      }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        onChange: (current, pageSize) => {
          setPagination({ current, pageSize });
        },
      }}
      locale={{
        emptyText: <Empty description={emptyDescription} />,
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder={'请输入标题搜索'}
              style={{ width: 260 }}
              onSearch={(value) => {
                setPagination((previous) => ({
                  ...previous,
                  current: 1,
                }));
                setTitle(value);
              }}
            />

            <Select
              allowClear
              placeholder={'请选择优先级'}
              style={{ width: 160 }}
              options={TodoPriorityOptions}
              value={priority}
              onChange={(value) => {
                setPagination((previous) => ({
                  ...previous,
                  current: 1,
                }));
                setPriority(value);
              }}
            />

            <Select
              allowClear
              placeholder={'请选择状态'}
              style={{ width: 160 }}
              options={TodoStatusOptions}
              value={status}
              onChange={(value) => {
                setPagination((previous) => ({
                  ...previous,
                  current: 1,
                }));
                setStatus(value);
              }}
            />
          </Space>

          <Space>
            <KTable.Button
              type={'primary'}
              permissionCode={PERMISSION_RESOURCE.projectTaskCreate}
              onClick={async () => {
                await handleCreateTask();
              }}
            >
              新建任务
            </KTable.Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default TodoTable;
