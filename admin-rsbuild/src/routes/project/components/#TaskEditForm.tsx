import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';

import {
  ApiProject,
  ApiProjectTask,
  ApiProjectTaskType,
} from '@/api';
import type { Project } from '@/api/modules/project.types';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
import {
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusLabel,
  TaskStatusOptions,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import { KMarkdownEditor, UserSelect } from '@/components';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

import TaskIterationSelect from './#TaskIterationSelect';
import {
  buildTaskEditInitialValues,
  buildTaskEditPayload,
  type TaskEditFormValues,
  validateWorkDaysValue,
} from './#taskEditFormHelper';

interface TaskEditFormProps {
  /**
   * 保存成功后的回调。
   */
  onSuccess?: () => Promise<void>;

  /**
   * 任务详情。
   */
  task: ProjectTaskDetail;

  /**
   * 状态配置。
   */
  statusConfigs?: TaskStatusConfig[];

  /**
   * 已加载的迭代列表。
   */
  iterations?: ProjectTaskIteration[];

  /**
   * demo 或自定义提交时的覆盖提交逻辑。
   */
  onSubmitOverride?: (
    values: TaskEditFormValues,
    payload: ReturnType<typeof buildTaskEditPayload>,
  ) => Promise<void>;
}

/**
 * 任务编辑表单。
 *
 * 任务详情、项目任务列表和待办入口都通过任务编辑弹窗进入这里，避免不同页面
 * 分别维护字段布局与提交 payload。
 */
const TaskEditForm = (props: TaskEditFormProps) => {
  const [form] = Form.useForm<TaskEditFormValues>();

  const projectListQuery = useQuery({
    queryKey: [...queryKey.project.list(), 'task-edit'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });
  const taskTypeQuery = useQuery({
    queryKey: queryKey.project.taskTypeList(),
    queryFn: () => ApiProjectTaskType.getList(),
  });

  const projectOptions = useMemo(() => {
    const items = projectListQuery.data?.items;
    if (!items) {
      return [];
    }

    return buildProjectOptions(items, props.task);
  }, [projectListQuery.data, props.task]);

  const statusOptions = useMemo(() => {
    return buildStatusOptions(props.statusConfigs, props.task.status);
  }, [props.statusConfigs, props.task.status]);
  const typeOptions = useMemo(() => {
    return buildTypeOptions(taskTypeQuery.data, props.task);
  }, [props.task, taskTypeQuery.data]);

  useEffect(() => {
    form.setFieldsValue(buildTaskEditInitialValues(props.task));

    const timer = window.setTimeout(() => {
      form.focusField('title');
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, props.task]);

  const submitForm = async (values: TaskEditFormValues) => {
    const payload = buildTaskEditPayload(props.task, values);

    if (props.onSubmitOverride) {
      await props.onSubmitOverride(values, payload);
    } else {
      await ApiProjectTask.edit(props.task.id, payload);
    }

    if (props.onSuccess) {
      await props.onSuccess();
    }
  };

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      style={{ height: '100%' }}
      initialValues={buildTaskEditInitialValues(props.task)}
      onFinish={async (values) => {
        await submitForm(values);
        return true;
      }}
    >
      {renderEditContent({
        iterations: props.iterations,
        projectOptions,
        statusOptions,
        task: props.task,
        typeOptions,
      })}
    </KModal.Form>
  );
};

interface TaskEditContentProps {
  iterations?: ProjectTaskIteration[];
  projectOptions: Array<{ label: string; value: number }>;
  statusOptions: Array<{ label: string; value: string; disabled?: boolean }>;
  task: ProjectTaskDetail;
  typeOptions: Array<{ label: string; value: number; disabled?: boolean }>;
}

/**
 * 渲染任务编辑窗口字段。
 *
 * 字段布局只保留在任务编辑弹窗中，任务详情抽屉通过打开该弹窗完成编辑，
 * 避免两处字段增减和校验规则长期漂移。
 *
 * @param props 编辑窗口字段渲染参数
 * @return 任务编辑窗口内容
 */
function renderEditContent(props: TaskEditContentProps) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Row gutter={16} align={'stretch'} style={{ height: '100%' }}>
        <Col span={18} style={{ display: 'flex' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <Form.Item
              name={'title'}
              label={'任务标题'}
              rules={[{ required: true, message: '请输入任务标题' }]}
            >
              <Input placeholder={'请输入任务标题'} maxLength={128} showCount />
            </Form.Item>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  color: 'var(--ant-colorText)',
                  lineHeight: '22px',
                }}
              >
                任务详情
              </div>

              <Form.Item name={'description'} style={{ marginBottom: 0 }}>
                <KMarkdownEditor
                  placeholder={'请输入任务详情，支持 Markdown 和粘贴图片上传'}
                  height={520}
                  toolbarPreset={'compact'}
                />
              </Form.Item>
            </div>
          </div>
        </Col>

        <Col span={6} style={{ display: 'flex' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <Form.Item name={'projectId'} label={'项目'}>
              <Select
                options={props.projectOptions}
                placeholder={'请选择所属项目'}
                showSearch={{
                  optionFilterProp: 'label',
                }}
              />
            </Form.Item>

            <Form.Item name={'assigneeId'} label={'负责人'}>
              <UserSelect valueLabel={props.task.assignee} />
            </Form.Item>

            <Form.Item
              name={'typeId'}
              label={'类型'}
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select options={props.typeOptions} />
            </Form.Item>

            <Form.Item name={'iterationId'} label={'迭代'}>
              <TaskIterationSelect
                iterations={props.iterations}
                selectedIteration={{
                  id: props.task.iterationId,
                  name: props.task.iterationName,
                }}
              />
            </Form.Item>

            <Form.Item
              name={'status'}
              label={'状态'}
              rules={[{ required: true, message: '请选择任务状态' }]}
            >
              <Select options={props.statusOptions} />
            </Form.Item>

            <Form.Item
              name={'priority'}
              label={'优先级'}
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select options={TaskPriorityOptions} />
            </Form.Item>

            <Form.Item
              name={'workDays'}
              label={'预计工时（人天）'}
              rules={[
                {
                  validator: async (_, value) => {
                    if (validateWorkDaysValue(value)) {
                      return;
                    }

                    throw new Error('预计工时必须大于 0 且按 0.5 人天递增');
                  },
                },
              ]}
            >
              <InputNumber
                min={0.5}
                step={0.5}
                precision={1}
                placeholder={'请输入预计工时'}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name={'startTime'} label={'开始时间'}>
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder={'请选择开始时间'}
              />
            </Form.Item>

            <Form.Item
              name={'dueTime'}
              label={'截止时间'}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder={'请选择截止时间'}
              />
            </Form.Item>
          </div>
        </Col>
      </Row>
    </div>
  );
}

/**
 * 构造项目下拉选项。
 *
 * 项目列表采用分页接口一次拉取较大页数，极端情况下当前任务所属项目可能不在
 * 当前结果中。此处补充当前项目兜底项，避免编辑历史任务时选择器只显示数字 ID。
 *
 * @param projects 项目分页结果
 * @param task 当前任务
 * @return 可展示的项目选项
 */
function buildProjectOptions(projects: Project[], task: ProjectTaskDetail) {
  const options = projects.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });

  const currentProjectExists = projects.some((item) => {
    return item.id === task.projectId;
  });
  if (currentProjectExists) {
    return options;
  }

  let currentProjectName = `项目#${task.projectId}`;
  if (task.projectName) {
    currentProjectName = task.projectName;
  }

  return [
    ...options,
    {
      label: `${currentProjectName}（当前项目）`,
      value: task.projectId,
    },
  ];
}

/**
 * 构造状态下拉选项。
 *
 * 这里兼容历史状态，避免旧任务在编辑时因为状态已下线而直接丢值。
 *
 * @param statusConfigs 后端状态配置
 * @param currentStatus 当前任务状态
 * @return 可展示的状态选项
 */
function buildStatusOptions(
  statusConfigs?: TaskStatusConfig[],
  currentStatus?: string,
) {
  if (statusConfigs && statusConfigs.length > 0) {
    const options = statusConfigs.map((item) => {
      return {
        label: item.name,
        value: item.code,
      };
    });

    let taskStatusExists = true;
    if (currentStatus) {
      taskStatusExists = statusConfigs.some(
        (item) => item.code === currentStatus,
      );
    }

    if (taskStatusExists || !currentStatus) {
      return options;
    }

    return [
      ...options,
      {
        label: `${currentStatus}（历史状态）`,
        value: currentStatus,
        disabled: true,
      },
    ];
  }

  const options = [...TaskStatusOptions];

  if (currentStatus !== TaskStatus.Canceled) {
    return options;
  }

  return [
    ...options,
    {
      label: `${TaskStatusLabel[TaskStatus.Canceled]}（历史状态）`,
      value: TaskStatus.Canceled,
      disabled: true,
    },
  ];
}

/**
 * 构造类型下拉选项。
 *
 * 这里兼容历史类型，避免旧任务在编辑时因为类型已删除而无法回显当前值。
 *
 * @param typeConfigs 后端类型配置
 * @param task 当前任务
 * @return 可展示的类型选项
 */
function buildTypeOptions(
  typeConfigs?: ProjectTaskType[],
  task?: ProjectTaskDetail,
) {
  const options = (typeConfigs ?? []).map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });

  if (!task?.typeId) {
    return options;
  }

  const currentTypeExists = (typeConfigs ?? []).some((item) => {
    return item.id === task.typeId;
  });
  if (currentTypeExists) {
    return options;
  }

  return [
    ...options,
    {
      label: `${task.typeName || `类型#${task.typeId}`}（历史类型）`,
      value: task.typeId,
      disabled: true,
    },
  ];
}

export default TaskEditForm;
