import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { ApiProjectTaskIteration } from '@/api';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import queryKey from '@/constants/queryKey';

interface TaskIterationSelectProps {
  /** 禁用状态。 */
  disabled?: boolean;
  /** 外部已加载的迭代列表。 */
  iterations?: ProjectTaskIteration[];
  /** 历史任务当前绑定的迭代。 */
  selectedIteration?: {
    id?: number;
    name?: string;
  };
  /** 当前值。 */
  value?: number;
  /** 值变化回调。 */
  onChange?: (value?: number) => void;
}

/**
 * 任务迭代选择器。
 *
 * 表单可能来自敏捷面板、项目任务页或我的待办页。这里允许外部传入已缓存的
 * 迭代列表，也能在普通入口下自行加载，避免各入口重复实现历史迭代兜底逻辑。
 */
const TaskIterationSelect = (props: TaskIterationSelectProps) => {
  const iterationQuery = useQuery({
    queryKey: queryKey.project.taskIterationList(),
    queryFn: () => ApiProjectTaskIteration.getList(),
    enabled: props.iterations === undefined,
  });

  const iterationOptions = useMemo(() => {
    const sourceIterations = props.iterations ?? iterationQuery.data ?? [];
    const options = sourceIterations.map((item) => {
      return {
        label: `${item.name}（${item.startDate} ~ ${item.endDate}）`,
        value: item.id,
      };
    });

    const selectedIterationId = props.selectedIteration?.id;
    if (selectedIterationId === undefined) {
      return options;
    }

    const iterationExists = sourceIterations.some((item) => {
      return item.id === selectedIterationId;
    });
    if (iterationExists) {
      return options;
    }

    return [
      ...options,
      {
        label: `${props.selectedIteration?.name || `迭代#${selectedIterationId}`}（历史迭代）`,
        value: selectedIterationId,
        disabled: true,
      },
    ];
  }, [iterationQuery.data, props.iterations, props.selectedIteration]);

  return (
    <Select<number>
      allowClear
      disabled={props.disabled}
      loading={iterationQuery.isFetching}
      options={iterationOptions}
      placeholder="选择任务迭代"
      showSearch={{
        optionFilterProp: 'label',
      }}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export default TaskIterationSelect;
