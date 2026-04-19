import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tabs,
  Typography,
  message,
} from 'antd';

import {
  ApiProject,
  ApiProjectTask,
  ApiProjectTaskChangeLog,
  ApiProjectTaskType,
} from '@/api';
import type { Project } from '@/api/modules/project.types';
import type {
  ProjectTaskChangeLogItem,
  ProjectTaskChangeItem,
} from '@/api/modules/project-task-change-log';
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
  TaskDetailPreviewItem,
  TaskDetailPreviewList,
  TaskDetailSubtaskCell,
  TaskDetailSubtaskHeadRow,
  TaskDetailSubtaskHint,
  TaskDetailSubtaskRow,
  TaskDetailSubtaskTable,
  TaskDetailSubtaskToolbar,
  TaskDetailSubtaskTitleCell,
  TaskDetailTabsShell,
  TaskDetailTimelineBody,
  TaskDetailTimelineItem,
  TaskDetailTimelineList,
  TaskDetailTimelineTitle,
  TaskEditFieldLabel,
  TaskEditMetaGrid,
  TaskEditTitleCard,
  TaskEditToolbarHint,
} from '@/routes/agile-board/styles/task-detail-drawer.styled';

import {
  buildTaskEditInitialValues,
  buildTaskEditPayload,
  type TaskEditFormMode,
  type TaskEditFormValues,
  validateWorkDaysValue,
} from './#taskEditFormHelper';
import {
  getBoardStatusText,
  getTaskAssigneeText,
} from '@/routes/agile-board/#helper';
import {
  buildQuickCreateSubtaskPayload,
  resolveInitialSubtaskStatus,
} from '@/routes/agile-board/#taskDrawerSubtaskHelper';

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
  const queryClient = useQueryClient();
  const [activeTabKey, setActiveTabKey] = useState('detail');
  const [submitting, setSubmitting] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);

  let mode: TaskEditFormMode = 'full';
  if (props.mode !== undefined) {
    mode = props.mode;
  }

  const isDrawerMode = mode === 'drawer';
  const watchedValues = Form.useWatch([], form);

  const projectListQuery = useQuery({
    queryKey: [...queryKey.project.list(), 'task-edit'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
    enabled: !isDrawerMode,
  });
  const taskTypeQuery = useQuery({
    queryKey: queryKey.project.taskTypeList(),
    queryFn: () => ApiProjectTaskType.getList(),
  });

  const subtaskQuery = useQuery({
    queryKey: queryKey.project.taskChildren(props.task.id),
    queryFn: () => ApiProjectTask.getChildren(props.task.id),
    enabled: isDrawerMode && props.previewSubtasks === undefined,
  });

  const changeLogQuery = useQuery({
    queryKey: [...queryKey.project.taskChangeLog(props.task.id), 'drawer-tab'],
    queryFn: () =>
      ApiProjectTaskChangeLog.getList({
        taskId: props.task.id,
        current: 1,
        pageSize: 20,
      }),
    enabled: isDrawerMode && props.previewChangeLogs === undefined,
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

  const subtaskItems = useMemo(() => {
    if (props.previewSubtasks !== undefined) {
      return props.previewSubtasks;
    }

    const items = subtaskQuery.data;
    if (!items) {
      return [];
    }

    return items;
  }, [props.previewSubtasks, subtaskQuery.data]);

  const changeLogItems = useMemo(() => {
    if (props.previewChangeLogs !== undefined) {
      return props.previewChangeLogs;
    }

    const items = changeLogQuery.data?.items;
    if (!items) {
      return [];
    }

    return items;
  }, [changeLogQuery.data?.items, props.previewChangeLogs]);

  const changeLogCount = useMemo(() => {
    if (props.previewChangeLogs !== undefined) {
      return props.previewChangeLogs.length;
    }

    const total = changeLogQuery.data?.total;
    if (total === undefined) {
      return 0;
    }

    return total;
  }, [changeLogQuery.data?.total, props.previewChangeLogs]);

  const draftChangeItems = useMemo(() => {
    return buildDraftChangeItems(props.task, watchedValues);
  }, [props.task, watchedValues]);
  const initialSubtaskStatus = useMemo(() => {
    return resolveInitialSubtaskStatus(props.statusConfigs ?? []);
  }, [props.statusConfigs]);
  const canQuickCreateSubtask =
    Boolean(subtaskTitle.trim()) &&
    Boolean(initialSubtaskStatus) &&
    !creatingSubtask &&
    props.previewSubtasks === undefined;

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

  const handleQuickCreateSubtask = async () => {
    if (!canQuickCreateSubtask || !initialSubtaskStatus) {
      return;
    }

    setCreatingSubtask(true);

    try {
      await ApiProjectTask.create(
        buildQuickCreateSubtaskPayload(
          props.task,
          subtaskTitle,
          initialSubtaskStatus,
        ),
      );
      setSubtaskTitle('');
      message.success('子任务创建成功');
      await Promise.all([
        subtaskQuery.refetch(),
        changeLogQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: queryKey.project.taskChildren(props.task.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKey.project.taskChangeLog(props.task.id),
        }),
      ]);
    } catch (error) {
      message.error('子任务创建失败，请稍后重试');
      throw error;
    } finally {
      setCreatingSubtask(false);
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
                    <UserSelect />
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

                          throw new Error('预计工时必须大于 0 且按 0.5 人天递增');
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

            <TaskDetailTabsShell>
              <Tabs
                activeKey={activeTabKey}
                onChange={(nextKey) => {
                  setActiveTabKey(nextKey);
                }}
                items={[
                  {
                    key: 'detail',
                    label: '详情',
                    children: (
                      <TaskDetailDrawerStack>
                        <TaskDetailPanelCard
                          size={'small'}
                          title={
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              任务详情（Markdown）
                            </Typography.Text>
                          }
                        >
                          <TaskEditToolbarHint>
                            <Typography.Text type={'secondary'}>
                              支持 Markdown、代码块与粘贴图片上传。
                            </Typography.Text>
                          </TaskEditToolbarHint>
                          <Form.Item
                            name={'description'}
                            style={{ marginBottom: 0 }}
                          >
                            <KMarkdownEditor
                              placeholder={
                                '请输入任务详情，支持 Markdown 和粘贴图片上传'
                              }
                              height={320}
                              toolbarPreset={'compact'}
                            />
                          </Form.Item>
                        </TaskDetailPanelCard>
                      </TaskDetailDrawerStack>
                    ),
                  },
                  {
                    key: 'subtask',
                    label: `子任务 ${subtaskItems.length}`,
                    children: (
                      <TaskDetailDrawerStack>
                        <TaskDetailPanelCard
                          size={'small'}
                          title={
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              子任务编辑区
                            </Typography.Text>
                          }
                        >
                          <Typography.Text type={'secondary'}>
                            支持查看当前拆解项，并直接按真实接口回显状态、负责人与截止时间。
                          </Typography.Text>
                          <TaskDetailSubtaskToolbar>
                            <TaskDetailSubtaskHint>
                              默认继承父任务负责人与优先级，创建后可继续补充字段。
                            </TaskDetailSubtaskHint>
                            <div style={{ display: 'flex', gap: 8, minWidth: 320 }}>
                              <Input
                                value={subtaskTitle}
                                disabled={creatingSubtask || props.previewSubtasks !== undefined}
                                placeholder={'输入子任务标题后回车创建'}
                                onChange={(event) => {
                                  setSubtaskTitle(event.target.value);
                                }}
                                onPressEnter={async () => {
                                  await handleQuickCreateSubtask();
                                }}
                              />
                              <Button
                                type={'primary'}
                                loading={creatingSubtask}
                                disabled={!canQuickCreateSubtask}
                                onClick={async () => {
                                  await handleQuickCreateSubtask();
                                }}
                              >
                                新增子任务
                              </Button>
                            </div>
                          </TaskDetailSubtaskToolbar>
                          {renderSubtaskTable({
                            items: subtaskItems,
                            statusConfigs: props.statusConfigs ?? [],
                            isLoading: subtaskQuery.isLoading,
                            isError: subtaskQuery.isError,
                          })}
                        </TaskDetailPanelCard>
                      </TaskDetailDrawerStack>
                    ),
                  },
                  {
                    key: 'changeLog',
                    label: `变更日志 ${changeLogCount}`,
                    children: (
                      <TaskDetailDrawerStack>
                        <TaskDetailPanelCard
                          size={'small'}
                          title={
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              变更日志预览
                            </Typography.Text>
                          }
                        >
                          <Typography.Text type={'secondary'}>
                            先展示本次待保存的草稿，再接入真实接口中的历史记录。
                          </Typography.Text>
                          <TaskDetailPreviewList>
                            {renderDraftChangePreview(draftChangeItems)}
                          </TaskDetailPreviewList>
                        </TaskDetailPanelCard>

                        <TaskDetailPanelCard
                          size={'small'}
                          title={
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              历史变更记录
                            </Typography.Text>
                          }
                        >
                          {renderChangeLogTimeline({
                            items: changeLogItems,
                            isLoading: changeLogQuery.isLoading,
                            isError: changeLogQuery.isError,
                          })}
                        </TaskDetailPanelCard>
                      </TaskDetailDrawerStack>
                    ),
                  },
                ]}
              />
            </TaskDetailTabsShell>
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
            <Button
              type={'primary'}
              htmlType={'submit'}
              loading={submitting}
            >
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
              <UserSelect />
            </Form.Item>

            <Form.Item
              name={'typeId'}
              label={'类型'}
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select options={typeOptions} />
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

            <Form.Item name={'dueTime'} label={'截止时间'} style={{ marginBottom: 0 }}>
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
      taskStatusExists = statusConfigs.some((item) => item.code === currentStatus);
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
 * 渲染抽屉内的子任务表格。
 *
 * @param items 子任务列表
 * @param isLoading 是否加载中
 * @param isError 是否加载失败
 * @param statusConfigs 状态配置
 * @return 预览节点
 */
function renderSubtaskTable(options: {
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskDetail[];
  statusConfigs: TaskStatusConfig[];
}) {
  if (options.isLoading) {
    return <Typography.Text type={'secondary'}>子任务加载中...</Typography.Text>;
  }

  if (options.isError) {
    return <Alert type={'error'} showIcon message={'子任务加载失败，请稍后重试。'} />;
  }

  if (!options.items.length) {
    return <Typography.Text type={'secondary'}>暂无子任务</Typography.Text>;
  }

  return (
    <TaskDetailSubtaskTable>
      <TaskDetailSubtaskHeadRow>
        <div>子任务</div>
        <div>状态</div>
        <div>负责人</div>
        <div>截止时间</div>
      </TaskDetailSubtaskHeadRow>
      {options.items.map((item) => {
        return (
          <TaskDetailSubtaskRow key={item.id}>
            <TaskDetailSubtaskTitleCell>{item.title}</TaskDetailSubtaskTitleCell>
            <TaskDetailSubtaskCell>
              {getBoardStatusText(item.status, options.statusConfigs)}
            </TaskDetailSubtaskCell>
            <TaskDetailSubtaskCell>{getTaskAssigneeText(item)}</TaskDetailSubtaskCell>
            <TaskDetailSubtaskCell>{formatDueDate(item.dueTime)}</TaskDetailSubtaskCell>
          </TaskDetailSubtaskRow>
        );
      })}
    </TaskDetailSubtaskTable>
  );
}

/**
 * 渲染草稿变更预览。
 *
 * @param items 草稿变更列表
 * @return 预览节点
 */
function renderDraftChangePreview(items: ProjectTaskChangeItem[]) {
  if (!items.length) {
    return (
      <Typography.Text type={'secondary'}>
        当前未检测到字段改动，保存后不会新增变更记录。
      </Typography.Text>
    );
  }

  return items.map((item, index) => {
    return (
      <TaskDetailPreviewItem key={`${item.field}-${index}`}>
        <Typography.Text strong>{item.label}</Typography.Text>
        <Typography.Text type={'secondary'}>
          {`${item.beforeValue} → ${item.afterValue}`}
        </Typography.Text>
      </TaskDetailPreviewItem>
    );
  });
}

/**
 * 渲染历史变更日志时间线。
 *
 * @param items 历史日志
 * @param isLoading 是否加载中
 * @param isError 是否加载失败
 * @return 节点
 */
function renderChangeLogTimeline(options: {
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskChangeLogItem[];
}) {
  if (options.isLoading) {
    return <Typography.Text type={'secondary'}>历史日志加载中...</Typography.Text>;
  }

  if (options.isError) {
    return <Alert type={'error'} showIcon message={'历史日志加载失败，请稍后重试。'} />;
  }

  if (!options.items.length) {
    return <Typography.Text type={'secondary'}>暂无历史日志</Typography.Text>;
  }

  return (
    <TaskDetailTimelineList>
      {options.items.map((item) => {
        return (
          <TaskDetailTimelineItem key={item.id}>
            <TaskDetailTimelineTitle>
              {`${item.createdAt} · ${item.operatorName}`}
            </TaskDetailTimelineTitle>
            <TaskDetailTimelineBody>
              {buildChangeLogSummary(item)}
            </TaskDetailTimelineBody>
          </TaskDetailTimelineItem>
        );
      })}
    </TaskDetailTimelineList>
  );
}

/**
 * 构造历史日志摘要。
 *
 * @param item 日志项
 * @return 摘要文案
 */
function buildChangeLogSummary(item: ProjectTaskChangeLogItem) {
  if (!item.changes.length) {
    return item.operationText;
  }

  return item.changes
    .map((change) => {
      return `${change.label}：${change.beforeValue || '-'} → ${change.afterValue || '-'}`;
    })
    .join('；');
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

/**
 * 生成编辑态的草稿变更项。
 *
 * @param task 原始任务
 * @param values 当前表单值
 * @return 草稿变更记录
 */
function buildDraftChangeItems(
  task: ProjectTaskDetail,
  values?: Partial<TaskEditFormValues>,
): ProjectTaskChangeItem[] {
  if (!values) {
    return [];
  }

  const items: ProjectTaskChangeItem[] = [];

  if (values.title !== undefined && values.title !== task.title) {
    items.push({
      field: 'title',
      label: '任务标题',
      beforeValue: task.title,
      afterValue: values.title,
    });
  }

  const originalDescription = normalizeText(task.description);
  const nextDescription = normalizeText(values.description);
  if (values.description !== undefined && nextDescription !== originalDescription) {
    items.push({
      field: 'description',
      label: '任务详情',
      beforeValue: summarizeText(originalDescription),
      afterValue: summarizeText(nextDescription),
    });
  }

  if (values.priority !== undefined && values.priority !== task.priority) {
    items.push({
      field: 'priority',
      label: '优先级',
      beforeValue: task.priority,
      afterValue: values.priority,
    });
  }

  if (values.status !== undefined && values.status !== task.status) {
    items.push({
      field: 'status',
      label: '状态',
      beforeValue: task.status,
      afterValue: values.status,
    });
  }

  if (values.assigneeId !== undefined && values.assigneeId !== task.assigneeId) {
    items.push({
      field: 'assigneeId',
      label: '负责人',
      beforeValue: formatDraftAssignee(task.assigneeId, task.assignee),
      afterValue: formatDraftAssignee(values.assigneeId),
    });
  }

  if (values.workDays !== undefined && values.workDays !== task.workDays) {
    items.push({
      field: 'workDays',
      label: '预计工时',
      beforeValue: formatWorkDays(task.workDays),
      afterValue: formatWorkDays(values.workDays),
    });
  }

  return items;
}

/**
 * 规范化文本，避免 undefined 与空串反复触发“已修改”。
 *
 * @param value 原始文本
 * @return 规范化后的文本
 */
function normalizeText(value?: string) {
  if (!value) {
    return '';
  }

  return value.trim();
}

/**
 * 缩略长文本，避免预览区被长段 Markdown 撑开。
 *
 * @param value 原始文本
 * @return 摘要文本
 */
function summarizeText(value: string) {
  if (!value) {
    return '空';
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 24)}...`;
}

/**
 * 格式化负责人预览。
 *
 * @param assigneeId 负责人 ID
 * @param assigneeName 负责人名称
 * @return 负责人文本
 */
function formatDraftAssignee(assigneeId?: number, assigneeName?: string) {
  if (assigneeId === undefined || assigneeId === 0) {
    return '未分配';
  }

  if (assigneeName) {
    return assigneeName;
  }

  return `用户 #${assigneeId}`;
}

/**
 * 格式化子任务负责人文本。
 *
 * @param task 子任务
 * @return 负责人文本
 */
function formatAssigneeText(task: ProjectTaskDetail) {
  if (task.assignee) {
    return task.assignee;
  }

  if (task.assigneeId !== undefined && task.assigneeId !== 0) {
    return `用户 #${task.assigneeId}`;
  }

  return '未分配';
}

/**
 * 格式化截止时间展示。
 *
 * @param dueTime 截止时间
 * @return 文本
 */
function formatDueDate(dueTime?: string) {
  if (!dueTime) {
    return '-';
  }

  if (dueTime.length >= 10) {
    return dueTime.slice(5, 10);
  }

  return dueTime;
}

/**
 * 格式化工时文本。
 *
 * @param value 工时值
 * @return 工时展示文本
 */
function formatWorkDays(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }

  return `${value} 人天`;
}

export default TaskEditForm;
