import { Button, Flex, Input, Select, Space } from 'antd';

import {
  TaskPriority,
  TaskPriorityOptions,
} from '@/api/modules/project-task.types';
import { UserSelect } from '@/components';
import Icons from '@/icons';

interface AgileBoardToolbarProps {
  assigneeId?: number;
  hasFilters: boolean;
  priority?: TaskPriority;
  projectId?: number;
  projectOptions: Array<{ label: string; value: number }>;
  onAssigneeChange: (value?: number) => void;
  onCreate: () => Promise<void>;
  onPriorityChange: (value?: TaskPriority) => void;
  onProjectChange: (value?: number) => void;
  onReset: () => void;
  onTitleSearch: (value: string) => void;
}

/**
 * 敏捷面板工具栏。
 */
const AgileBoardToolbar = (props: AgileBoardToolbarProps) => {
  return (
    <Flex vertical gap={8} style={{ width: '100%' }}>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          lineHeight: '26px',
          color: 'var(--ant-colorText)',
        }}
      >
        敏捷面板
      </div>

      <Space wrap size={8} style={{ width: '100%' }}>
        <Input.Search
          allowClear
          placeholder="搜索任务标题"
          style={{ width: 220 }}
          onSearch={props.onTitleSearch}
        />

        <Select
          allowClear
          placeholder="筛选项目"
          style={{ width: 180 }}
          value={props.projectId}
          options={props.projectOptions}
          showSearch={{
            optionFilterProp: 'label',
          }}
          onChange={props.onProjectChange}
        />

        <div style={{ width: 180 }}>
          <UserSelect
            size="middle"
            value={props.assigneeId}
            placeholder="筛选负责人"
            onChange={props.onAssigneeChange}
          />
        </div>

        <Select
          allowClear
          placeholder="筛选优先级"
          style={{ width: 130 }}
          value={props.priority}
          options={TaskPriorityOptions}
          onChange={props.onPriorityChange}
        />

        <Button
          disabled={!props.hasFilters}
          onClick={props.onReset}
        >
          重置筛选
        </Button>

        <Button
          type="primary"
          icon={<Icons.Plus />}
          onClick={props.onCreate}
        >
          新建任务
        </Button>
      </Space>
    </Flex>
  );
};

export default AgileBoardToolbar;
