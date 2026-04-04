import { Button } from 'antd';

import {
  TaskPriority,
  TaskPriorityOptions,
} from '@/api/modules/project-task.types';
import { UserSelect } from '@/components';
import Icons from '@/icons';

import {
  ToolbarField,
  ToolbarRoot,
  ToolbarRow,
  ToolbarSearchInput,
  ToolbarSelect,
  ToolbarSurface,
  ToolbarTitle,
} from '../styles/toolbar.styled';

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
    <ToolbarRoot>
      <ToolbarTitle>敏捷面板</ToolbarTitle>

      <ToolbarSurface>
        <ToolbarRow wrap size={8}>
          <ToolbarField $width={220}>
            <ToolbarSearchInput
              allowClear
              placeholder="搜索任务标题或编号"
              onSearch={props.onTitleSearch}
            />
          </ToolbarField>

          <ToolbarField $width={180}>
            <ToolbarSelect
              allowClear
              placeholder="筛选项目"
              value={props.projectId}
              options={props.projectOptions}
              showSearch={{
                optionFilterProp: 'label',
              }}
              onChange={props.onProjectChange}
            />
          </ToolbarField>

          <ToolbarField $width={180}>
            <UserSelect
              size="middle"
              value={props.assigneeId}
              placeholder="筛选负责人"
              onChange={props.onAssigneeChange}
            />
          </ToolbarField>

          <ToolbarField $width={130}>
            <ToolbarSelect
              allowClear
              placeholder="筛选优先级"
              value={props.priority}
              options={TaskPriorityOptions}
              onChange={props.onPriorityChange}
            />
          </ToolbarField>

          <Button disabled={!props.hasFilters} onClick={props.onReset}>
            重置筛选
          </Button>

          <Button
            type="primary"
            icon={<Icons.Plus />}
            onClick={props.onCreate}
          >
            新建任务
          </Button>
        </ToolbarRow>
      </ToolbarSurface>
    </ToolbarRoot>
  );
};

export default AgileBoardToolbar;
