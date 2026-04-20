import type { ReactNode, RefObject } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

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
  extraActions?: ReactNode;
  enterV2ButtonRef?: RefObject<HTMLDivElement | null>;
  hasFilters: boolean;
  priority?: TaskPriority;
  projectId?: number;
  projectOptions: Array<{ label: string; value: number }>;
  titleSearchValue: string;
  onAssigneeChange: (value?: number) => void;
  onCreate: () => Promise<void>;
  onEnterV2?: () => Promise<void>;
  onEnterV2AndRemember?: () => Promise<void>;
  onPriorityChange: (value?: TaskPriority) => void;
  onProjectChange: (value?: number) => void;
  onReset: () => void;
  onTitleSearchChange: (value: string) => void;
}

/**
 * 敏捷面板工具栏。
 */
const AgileBoardToolbar = (props: AgileBoardToolbarProps) => {
  let enterV2ButtonNode = null;

  if (props.onEnterV2) {
    const enterV2MenuItems: MenuProps['items'] = [];

    if (props.onEnterV2AndRemember) {
      enterV2MenuItems.push({
        key: 'remember-v2',
        label: '进入新版并记住',
      });
    }

    enterV2ButtonNode = (
      <div ref={props.enterV2ButtonRef}>
        <Dropdown.Button
          menu={{
            items: enterV2MenuItems,
            onClick: async (info) => {
              if (info.key === 'remember-v2' && props.onEnterV2AndRemember) {
                await props.onEnterV2AndRemember();
              }
            },
          }}
          onClick={props.onEnterV2}
        >
          进入新版
        </Dropdown.Button>
      </div>
    );
  }

  return (
    <ToolbarRoot>
      <ToolbarTitle>敏捷面板</ToolbarTitle>

      <ToolbarSurface>
        <ToolbarRow wrap size={8}>
          <ToolbarField $width={220}>
            <ToolbarSearchInput
              allowClear
              placeholder="搜索任务标题或编号"
              value={props.titleSearchValue}
              onChange={(event) => {
                props.onTitleSearchChange(event.target.value);
              }}
              onSearch={props.onTitleSearchChange}
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

          {enterV2ButtonNode}
          {props.extraActions}
        </ToolbarRow>
      </ToolbarSurface>
    </ToolbarRoot>
  );
};

export default AgileBoardToolbar;
