import { type ReactNode } from 'react';
import { Empty } from 'antd';
import type { TableProps } from 'antd';

import { ApiProjectTask } from '@/api';
import { type ProjectTaskListParams } from '@/api/modules/project-task.types';
import { KTable } from '@/components';
import queryKey from '@/constants/queryKey';

import { createProjectTaskColumns, type ProjectTaskColumnProps } from './#ProjectTaskColumns';
import { getEmptyDescription } from './#projectTaskHelper';
import type {
  ProjectTaskItem,
  TaskPaginationState,
} from './#projectTaskTypes';

interface ProjectTaskTableProps extends ProjectTaskColumnProps {
  hasFilters: boolean;
  numericProjectId: number;
  params: ProjectTaskListParams;
  pagination: TaskPaginationState;
  projectName?: string;
  selectedTaskIds?: number[];
  toolbar: ReactNode;
  onPaginationChange: (current: number, pageSize: number) => void;
  onSelectionChange?: (taskIds: number[]) => void;
  onTableChange: TableProps<ProjectTaskItem>['onChange'];
}

/**
 * 项目任务表格。
 */
const ProjectTaskTable = (props: ProjectTaskTableProps) => {
  const columns = createProjectTaskColumns(props);
  let rowSelection: TableProps<ProjectTaskItem>['rowSelection'];

  if (props.onSelectionChange) {
    /**
     * 多选状态由项目任务页托管，便于批量删除后主动清空选择。
     */
    rowSelection = {
      selectedRowKeys: props.selectedTaskIds,
      preserveSelectedRowKeys: true,
      onChange: (selectedRowKeys) => {
        props.onSelectionChange?.(selectedRowKeys as number[]);
      },
    };
  }

  return (
    <KTable<ProjectTaskItem>
      size="small"
      queryKey={[...queryKey.project.taskList(props.numericProjectId), props.params]}
      request={(requestParams) => ApiProjectTask.getList(requestParams)}
      params={props.params}
      columns={columns}
      onChange={props.onTableChange}
      rowSelection={rowSelection}
      scroll={{ x: 1760 }}
      pagination={{
        current: props.pagination.current,
        pageSize: props.pagination.pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        size: 'small',
        onChange: props.onPaginationChange,
      }}
      locale={{
        emptyText: (
          <Empty
            description={getEmptyDescription(props.hasFilters, props.projectName)}
          />
        ),
      }}
      toolbar={props.toolbar}
    />
  );
};

export default ProjectTaskTable;
