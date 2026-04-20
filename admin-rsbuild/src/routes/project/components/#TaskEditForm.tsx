import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  message,
} from 'antd';

import {
  ApiProject,
  ApiProjectTask,
  ApiProjectTaskType,
} from '@/api';
import type { Project } from '@/api/modules/project.types';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
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
import {
  TaskDetailDrawerFooterBar,
  TaskDetailDrawerScrollArea,
  TaskDetailDrawerStack,
  TaskDetailPanelCard,
  TaskEditFieldLabel,
  TaskEditMetaGrid,
  TaskEditTitleCard,
} from '@/routes/agile-board/styles/task-detail-drawer.styled';

import {
  buildTaskEditInitialValues,
  buildTaskEditPayload,
  type TaskEditFormMode,
  type TaskEditFormValues,
  validateWorkDaysValue,
} from './#taskEditFormHelper';

/**
 * 抽屉编辑态的 Markdown 编辑区高度。
 *
 * 抽屉场景下顶部基础信息区占用了较多纵向空间，原先 320px 的编辑区在录入
 * 较长任务说明时需要频繁滚动，编辑体验明显偏紧。这里继续上调到 560，
 * 让抽屉态更接近完整编辑态的可用面积，但仍保留底部操作栏的可见空间。
 */
const TASK_EDIT_FORM_DRAWER_MARKDOWN_HEIGHT = 560;

interface TaskEditFormProps {
  /**
   * 编辑模式。
   */
  mode?: TaskEditFormMode;

  /**
   * 外部取消回调。
   */
  onCancel?: () => void;

  /**
   * 打开完整编辑模式。
   */
  onOpenFullEdit?: (task: ProjectTaskDetail) => Promise<void>;

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
   * demo 或自定义提交时的覆盖提交逻辑。
   */
  onSubmitOverride?: (
    values: TaskEditFormValues,
    payload: ReturnType<typeof buildTaskEditPayload>,
  ) => Promise<void>;

  /**
   * demo 路由预置的子任务预览数据。
   */
  previewSubtasks?: ProjectTaskDetail[];

  /**
   * demo 路由预置的变更日志数据。
   */
  previewChangeLogs?: ProjectTaskChangeLogItem[];
}

/**
 * 任务编辑表单。
 *
 * 一个组件同时承接抽屉编辑态与独立完整编辑表单，避免后续出现两套
 * payload 组装逻辑继续漂移。
 */
const TaskEditForm = (props: TaskEditFormProps) => {
  const [form] = Form.useForm<TaskEditFormValues>();
  const [submitting, setSubmitting] = useState(false);

  let mode: TaskEditFormMode = 'full';
  if (props.mode !== undefined) {
    mode = props.mode;
  }

  const isDrawerMode = mode === 'drawer';

  const projectListQuery = useQuery({
    queryKey: [...queryKey.project.list(), 'task-edit'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
    enabled: !isDrawerMode,
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

    return items.map((item: Project) => {
      return {
        label: item.name,
        value: item.id,
      };
    });
  }, [projectListQuery.data]);

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
    const payload = buildTaskEditPayload(props.task, values, mode);

    if (props.onSubmitOverride) {
      await props.onSubmitOverride(values, payload);
    } else {
      await ApiProjectTask.edit(props.task.id, payload);
    }

    if (props.onSuccess) {
      await props.onSuccess();
    }
  };

  if (!isDrawerMode) {
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
        {renderFullEditContent({
          form,
          projectOptions,
          statusOptions,
          typeOptions,
        })}
      </KModal.Form>
    );
  }

  return (
    <Form<TaskEditFormValues>
      form={form}
      layout={'vertical'}
      initialValues={buildTaskEditInitialValues(props.task)}
      style={{ height: '100%', minHeight: 0 }}
      onFinish={async (values) => {
        setSubmitting(true);

        try {
          await submitForm(values);
          message.success('任务已保存');
        } catch (error) {
          message.error('保存失败，请稍后重试');
          throw error;
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <TaskDetailDrawerStack style={{ height: '100%', gap: 0 }}>
        <TaskDetailDrawerScrollArea>
          <TaskDetailDrawerStack>
            <TaskEditTitleCard size={'small'}>
              <Typography.Text type={'secondary'}>
                {`任务编号 ${resolveTaskNumber(props.task)}`}
              </Typography.Text>
              <Form.Item
                name={'title'}
                rules={[{ required: true, message: '请输入任务标题' }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder={'请输入任务标题'}
                  maxLength={128}
                  showCount
                />
              </Form.Item>
            </TaskEditTitleCard>

            <TaskDetailPanelCard
              size={'small'}
              title={
                <Typography.Text strong style={{ fontSize: 16 }}>
                  基础信息
                </Typography.Text>
              }
            >
              <TaskEditMetaGrid>
                <div>
                  <TaskEditFieldLabel>优先级</TaskEditFieldLabel>
                  <Form.Item
                    name={'priority'}
                    rules={[{ required: true, message: '请选择优先级' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select options={TaskPriorityOptions} />
                  </Form.Item>
                </div>

                <div>
                  <TaskEditFieldLabel>状态</TaskEditFieldLabel>
                  <Form.Item
                    name={'status'}
                    rules={[{ required: true, message: '请选择状态' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select options={statusOptions} />
                  </Form.Item>
                </div>

                <div>
                  <TaskEditFieldLabel>类型</TaskEditFieldLabel>
                  <Form.Item
                    name={'typeId'}
                    rules={[{ required: true, message: '请选择任务类型' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select options={typeOptions} />
                  </Form.Item>
                </div>

                <div>
                  <TaskEditFieldLabel>负责人</TaskEditFieldLabel>
                  <Form.Item name={'assigneeId'} style={{ marginBottom: 0 }}>
                    <UserSelect valueLabel={props.task.assignee} />
                  </Form.Item>
                </div>

                <div>
                  <TaskEditFieldLabel>预计工时（人天）</TaskEditFieldLabel>
                  <Form.Item
                    name={'workDays'}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (validateWorkDaysValue(value)) {
                            return;
                          }

                          throw new Error(
                            '预计工时必须大于 0 且按 0.5 人天递增',
                          );
                        },
                      },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0.5}
                      step={0.5}
                      precision={1}
                      placeholder={'请输入预计工时'}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </TaskEditMetaGrid>
            </TaskDetailPanelCard>

            <TaskDetailPanelCard
              size={'small'}
              title={
                <Typography.Text strong style={{ fontSize: 16 }}>
                  任务详情（Markdown）
                </Typography.Text>
              }
            >
              <Form.Item
                name={'description'}
                style={{ marginBottom: 0 }}
              >
                <KMarkdownEditor
                  placeholder={'请输入任务详情，支持粘贴图片上传'}
                  height={TASK_EDIT_FORM_DRAWER_MARKDOWN_HEIGHT}
                  toolbarPreset={'compact'}
                />
              </Form.Item>
            </TaskDetailPanelCard>
          </TaskDetailDrawerStack>
        </TaskDetailDrawerScrollArea>

        <TaskDetailDrawerFooterBar>
          <div>
            <Typography.Text type={'secondary'}>
              操作区固定在抽屉底部，滚动正文时始终可见。
            </Typography.Text>
            {props.onOpenFullEdit ? (
              <div style={{ marginTop: 4 }}>
                <Button
                  type={'link'}
                  style={{ padding: 0 }}
                  onClick={async () => {
                    await props.onOpenFullEdit?.(props.task);
                  }}
                >
                  完整编辑更多字段
                </Button>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={props.onCancel} disabled={submitting}>
              取消
            </Button>
            <Button type={'primary'} htmlType={'submit'} loading={submitting}>
              保存变更
            </Button>
          </div>
        </TaskDetailDrawerFooterBar>
      </TaskDetailDrawerStack>
    </Form>
  );
};

interface FullEditContentProps {
  form: ReturnType<typeof Form.useForm<TaskEditFormValues>>[0];
  projectOptions: Array<{ label: string; value: number }>;
  statusOptions: Array<{ label: string; value: string; disabled?: boolean }>;
  typeOptions: Array<{ label: string; value: number; disabled?: boolean }>;
}

/**
 * 完整编辑模式沿用旧弹窗字段集合，只把提交逻辑切换到新组件。
 */
function renderFullEditContent(props: FullEditContentProps) {
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
              <Select options={props.projectOptions} disabled />
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

/**
 * 解析任务编号展示文本。
 *
 * @param task 当前任务
 * @return 任务编号
 */
function resolveTaskNumber(task: ProjectTaskDetail) {
  if (task.taskNo) {
    return task.taskNo;
  }

  if (task.taskCode) {
    return task.taskCode;
  }

  if (task.code) {
    return task.code;
  }

  if (task.serialNumber !== undefined) {
    if (task.projectCode) {
      return `${task.projectCode}-${task.serialNumber}`;
    }

    return String(task.serialNumber);
  }

  if (task.projectCode) {
    return `${task.projectCode}-${task.id}`;
  }

  return String(task.id);
}

export default TaskEditForm;
