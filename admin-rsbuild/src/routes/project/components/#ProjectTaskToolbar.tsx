import { useMemo } from 'react';
import { Button, Flex, Input, Select, Space } from 'antd';

import {
  TaskPriority,
  TaskStatus,
} from '@/api/modules/project-task.types';
import Icons from '@/icons';

import {
  getAssigneeFilterOptions,
  getAssigneeFilterValue,
  getPriorityFilterValue,
  getStatusFilterValue,
  normalizeAssigneeFilterValue,
  normalizePriorityFilterValue,
  normalizeStatusFilterValue,
  priorityFilterOptions,
  statusFilterOptions,
} from './#projectTaskHelper';
import type { CellOption } from './#projectTaskTypes';

interface ProjectTaskToolbarProps {
  assigneeId?: number;
  memberOptions: CellOption[];
  priority?: TaskPriority;
  status?: TaskStatus;
  onAssigneeChange: (value?: number) => void;
  onCreate: () => Promise<void>;
  onPriorityChange: (value?: TaskPriority) => void;
  onStatusChange: (value?: TaskStatus) => void;
  onTitleSearch: (value: string) => void;
}

/**
 * 任务列表工具栏。
 */
const ProjectTaskToolbar = (props: ProjectTaskToolbarProps) => {
  const assigneeFilterOptions = useMemo(() => {
    return getAssigneeFilterOptions(props.memberOptions);
  }, [props.memberOptions]);

  return (
    <Flex justify="space-between" gap={8} wrap style={{ width: '100%' }}>
      <Space wrap size={8}>
        <Input.Search
          allowClear={false}
          size="small"
          placeholder="任务标题"
          style={{ width: 200 }}
          onSearch={props.onTitleSearch}
        />

        <Select
          allowClear={false}
          size="small"
          placeholder="优先级"
          style={{ width: 110 }}
          options={priorityFilterOptions}
          value={getPriorityFilterValue(props.priority)}
          onChange={(value) => {
            props.onPriorityChange(normalizePriorityFilterValue(value));
          }}
        />

        <Select
          allowClear={false}
          size="small"
          placeholder="状态"
          style={{ width: 128 }}
          options={statusFilterOptions}
          value={getStatusFilterValue(props.status)}
          onChange={(value) => {
            props.onStatusChange(normalizeStatusFilterValue(value));
          }}
        />

        <Select
          allowClear={false}
          size="small"
          placeholder="负责人"
          style={{ width: 160 }}
          value={getAssigneeFilterValue(props.assigneeId)}
          options={assigneeFilterOptions}
          showSearch={{
            optionFilterProp: 'label',
          }}
          onChange={(value) => {
            props.onAssigneeChange(normalizeAssigneeFilterValue(value));
          }}
        />
      </Space>

      <Button
        type="primary"
        size="small"
        icon={<Icons.Plus />}
        onClick={props.onCreate}
      >
        新建任务
      </Button>
    </Flex>
  );
};

export default ProjectTaskToolbar;
