import React, { useMemo, useState } from 'react';
import { Empty, Flex, Input, Select, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiTodo } from '@/api';
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
import queryKey from '@/constants/queryKey';

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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority | undefined>();
  const [status, setStatus] = useState<TodoStatus | undefined>();

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
      queryKey={[...queryKey.todo.list(), params]}
      request={(requestParams) => ApiTodo.getList(requestParams) as Promise<any>}
      params={params}
      columns={columns}
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
        emptyText: <Empty description={title ? '未找到匹配的待办' : '暂无待办数据'} />,
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
        </Flex>
      }
    />
  );
};

export default TodoTable;
