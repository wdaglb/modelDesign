import { useQuery } from '@tanstack/react-query';
import { Alert, Empty, Skeleton, Typography } from 'antd';

import { ApiProjectTaskChangeLog } from '@/api';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import queryKey from '@/constants/queryKey';

import {
  TaskPreviewChangeBlock,
  TaskPreviewChangeHeader,
  TaskPreviewChangeLogCard,
  TaskPreviewChangeLogList,
  TaskPreviewChangeValue,
  TaskPreviewOperatorMeta,
  TaskPreviewVerticalStack,
} from './styles/task-preview-drawer.styled';

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
    <TaskPreviewChangeLogList>
      {changeLogQuery.data.items.map((item) => {
        return <TaskChangeLogCard key={item.id} item={item} />;
      })}

      <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
        仅展示最近 {changeLogQuery.data.items.length} 条变更记录。
      </Typography.Text>
    </TaskPreviewChangeLogList>
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
    <TaskPreviewChangeLogCard size={'small'}>
      <TaskPreviewVerticalStack>
        <TaskPreviewChangeHeader>
          <div>
            <Typography.Text strong>{props.item.operationText}</Typography.Text>
            <TaskPreviewOperatorMeta>
              <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                {props.item.operatorName}
              </Typography.Text>
            </TaskPreviewOperatorMeta>
          </div>

          <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
            {props.item.createdAt}
          </Typography.Text>
        </TaskPreviewChangeHeader>

        {renderChangeContent(props.item)}
      </TaskPreviewVerticalStack>
    </TaskPreviewChangeLogCard>
  );
};

/**
 * 渲染单条变更内容。
 */
function renderChangeContent(item: ProjectTaskChangeLogItem) {
  if (!item.changes.length) {
    return (
      <Typography.Text type={'secondary'} style={{ fontSize: 13 }}>
        {getEmptyChangeText(item)}
      </Typography.Text>
    );
  }

  return (
    <TaskPreviewVerticalStack>
      {item.changes.map((change, index) => {
        return (
          <TaskPreviewChangeBlock key={`${item.id}-${change.field}-${index}`}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {change.label}
            </Typography.Text>
            <TaskPreviewChangeValue>
              <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                {formatChangeValue(change.beforeValue)} →{' '}
                {formatChangeValue(change.afterValue)}
              </Typography.Text>
            </TaskPreviewChangeValue>
          </TaskPreviewChangeBlock>
        );
      })}
    </TaskPreviewVerticalStack>
  );
}

/**
 * 获取无明细变更时的展示文案。
 */
function getEmptyChangeText(item: ProjectTaskChangeLogItem) {
  if (item.operationType === 'delete') {
    return '任务已删除';
  }

  if (item.operationType === 'create') {
    return '初始化信息';
  }

  return '本次操作无明细变更';
}

/**
 * 格式化变更值展示。
 */
function formatChangeValue(value?: string) {
  if (!value) {
    return '-';
  }

  return value;
}

export default TaskChangeLogPanel;
