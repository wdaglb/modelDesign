import { Badge, Card, Empty, Space, Typography } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { TaskPriority } from '@/api/modules/project-task.types';

import { getColumnDragId, getColumnSubtitle } from './#helper';
import type { AgileBoardColumnMeta, AgileBoardTask } from './#types';
import AgileBoardCard from './#BoardCard';

interface AgileBoardColumnProps {
  column: AgileBoardColumnMeta;
  disabled?: boolean;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  tasks: AgileBoardTask[];
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
}

/**
 * 敏捷面板列容器。
 */
const AgileBoardColumn = (props: AgileBoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDragId(props.column.status),
  });
  const columnSubtitle = getColumnSubtitle(props.column.isHistory);
  let subtitleNode = null;

  let columnBorder = '1px solid rgba(15, 23, 42, 0.08)';
  let columnBoxShadow = '0 12px 28px rgba(15, 23, 42, 0.08)';

  if (isOver && !props.disabled) {
    columnBorder = `1px solid ${props.column.accentColor}`;
    columnBoxShadow = `0 18px 36px ${props.column.accentColor}22`;
  }

  if (columnSubtitle) {
    subtitleNode = (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {columnSubtitle}
      </Typography.Text>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 280,
        width: 280,
        height: '100%',
        minHeight: 0,
        transition: 'all 0.2s ease',
      }}
    >
      <Card
        size="small"
        style={{
          height: '100%',
          minHeight: 0,
          borderRadius: 24,
          background: props.column.background,
          border: columnBorder,
          boxShadow: columnBoxShadow,
          overflow: 'hidden',
        }}
        styles={{
          header: {
            minHeight: 0,
            padding: '18px 18px 12px',
            borderBottom: 'none',
          },
          body: {
            height: 'calc(100% - 72px)',
            minHeight: 0,
            padding: '0 16px 6px 16px',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        title={
          <Space orientation="vertical" size={2} style={{ width: '100%' }}>
            <Space
              align="center"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <Typography.Title
                level={5}
                style={{ margin: 0, color: props.column.accentColor }}
              >
                {props.column.title}
              </Typography.Title>
              <Badge
                count={props.tasks.length}
                color={props.column.accentColor}
                styles={{ indicator: { boxShadow: 'none' } }}
              />
            </Space>
            {subtitleNode}
          </Space>
        }
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          {props.tasks.length === 0 && (
            <div
              style={{
                minHeight: 220,
                borderRadius: 16,
                border: `1px dashed ${props.column.accentColor}33`,
                background: 'rgba(255, 255, 255, 0.82)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="拖拽任务到这里"
              />
            </div>
          )}

          {props.tasks.length > 0 && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {props.tasks.map((task) => {
                return (
                  <div
                    key={task.id}
                    style={{
                      width: '100%',
                    }}
                  >
                    <AgileBoardCard
                      task={task}
                      disabled={props.disabled}
                      onPreview={props.onPreview}
                      onPriorityChange={props.onPriorityChange}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AgileBoardColumn;
