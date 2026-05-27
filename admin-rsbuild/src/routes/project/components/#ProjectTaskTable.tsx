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
  toolbar: ReactNode;
  onPaginationChange: (current: number, pageSize: number) => void;
  onTableChange: TableProps<ProjectTaskItem>['onChange'];
}

/**
 * 项目任务表格。
 */
const ProjectTaskTable = (props: ProjectTaskTableProps) => {
  const columns = createProjectTaskColumns(props);

  return (
    <KTable<ProjectTaskItem>
      size="small"
      queryKey={[...queryKey.project.taskList(props.numericProjectId), props.params]}
      request={(requestParams) => ApiProjectTask.getList(requestParams)}
      params={props.params}
      columns={columns}
      onChange={props.onTableChange}
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
