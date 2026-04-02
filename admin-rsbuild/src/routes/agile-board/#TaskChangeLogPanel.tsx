import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Empty, Skeleton, Space, Typography } from 'antd';

import { ApiProjectTaskChangeLog } from '@/api';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import queryKey from '@/constants/queryKey';

interface TaskChangeLogPanelProps {
  /**
   * 是否处于激活状态。
   */
  active: boolean;

  /**
   * 任务 ID。
   */
  taskId: number;
}

/**
 * 任务变更日志面板。
 */
const TaskChangeLogPanel = (props: TaskChangeLogPanelProps) => {
  const changeLogQuery = useQuery({
    queryKey: queryKey.project.taskChangeLog(props.taskId),
    queryFn: () => {
      return ApiProjectTaskChangeLog.getList({
        taskId: props.taskId,
        current: 1,
        pageSize: 20,
      });
    },
    enabled: props.active,
  });

  if (!props.active) {
    return null;
  }

  if (changeLogQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (changeLogQuery.isError) {
    return (
      <Alert
        type={'error'}
        showIcon
        message={'变更日志加载失败，请稍后重试。'}
      />
    );
  }

  if (!changeLogQuery.data?.items.length) {
    return <Empty description={'暂无变更日志'} />;
  }

  return (
    <Space
      direction={'vertical'}
      size={12}
      style={{ width: '100%' }}
      styles={{ item: { width: '100%' } }}
    >
      {changeLogQuery.data.items.map((item) => {
        return <TaskChangeLogCard key={item.id} item={item} />;
      })}

      <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
        仅展示最近 {changeLogQuery.data.items.length} 条变更记录。
      </Typography.Text>
    </Space>
  );
};

interface TaskChangeLogCardProps {
  /**
   * 日志项。
   */
  item: ProjectTaskChangeLogItem;
}

/**
 * 任务变更日志卡片。
 */
const TaskChangeLogCard = (props: TaskChangeLogCardProps) => {
  return (
    <Card
      size={'small'}
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <Space
        direction={'vertical'}
        size={10}
        style={{ width: '100%' }}
        styles={{ item: { width: '100%' } }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <Typography.Text strong>{props.item.operationText}</Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                {props.item.operatorName}
              </Typography.Text>
            </div>
          </div>

          <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
            {props.item.createdAt}
          </Typography.Text>
        </div>

        {renderChangeContent(props.item)}
      </Space>
    </Card>
  );
};

function renderChangeContent(item: ProjectTaskChangeLogItem) {
  if (!item.changes.length) {
    return (
      <Typography.Text type={'secondary'} style={{ fontSize: 13 }}>
        {getEmptyChangeText(item)}
      </Typography.Text>
    );
  }

  return (
    <Space
      direction={'vertical'}
      size={8}
      style={{ width: '100%' }}
      styles={{ item: { width: '100%' } }}
    >
      {item.changes.map((change, index) => {
        return (
          <div
            key={`${item.id}-${change.field}-${index}`}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.03)',
            }}
          >
            <Typography.Text strong style={{ fontSize: 13 }}>
              {change.label}
            </Typography.Text>
            <div style={{ marginTop: 6 }}>
              <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                {formatChangeValue(change.beforeValue)} →{' '}
                {formatChangeValue(change.afterValue)}
              </Typography.Text>
            </div>
          </div>
        );
      })}
    </Space>
  );
}

function getEmptyChangeText(item: ProjectTaskChangeLogItem) {
  if (item.operationType === 'delete') {
    return '任务已删除';
  }

  if (item.operationType === 'create') {
    return '初始化信息';
  }

  return '本次操作无明细变更';
}

function formatChangeValue(value?: string) {
  if (!value) {
    return '-';
  }

  return value;
}

export default TaskChangeLogPanel;
