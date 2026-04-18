import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { ApiProject, ApiProjectTask } from '@/api';
import type { Project } from '@/api/modules/project.types';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  TaskPriority,
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusLabel,
  TaskStatusOptions,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import type { CreateProjectTaskParams } from '@/api/modules/project-task.types';
import { KMarkdownEditor, UserSelect } from '@/components';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

import {
  getRememberedProjectIdFromStorage,
  saveRememberedProjectIdToStorage,
} from './#taskCreateFormHelper';

interface TaskCreateFormProps {
  /** 默认项目 ID。 */
  projectId?: number;
  /** 新建时默认负责人 ID。 */
  defaultAssigneeId?: number;
  /** 状态配置列表。 */
  statusConfigs?: TaskStatusConfig[];
  /** 编辑时传入的任务详情。 */
  task?: ProjectTaskDetail;
}

/**
 * 规范化提交到接口的负责人值。
 *
 * 前端清空选择时需要继续传 0，才能让后端反序列化为未分配。
 */
function getSubmitAssigneeId(value?: number) {
  if (value === undefined) {
    return 0;
  }

  return value;
}

/**
 * 校验预计工时输入值。
 *
 * @param value 工时值
 * @return 是否合法
 */
function validateWorkDaysValue(value?: number | null) {
  if (value === undefined || value === null) {
    return true;
  }
  if (value <= 0) {
    return false;
  }
  if (!Number.isInteger(value * 2)) {
    return false;
  }
  return true;
}

/**
 * 任务表单弹窗。
 *
 * 使用 KModal.Form 承载，通过 useKModal 打开，支持新建与编辑。
 */
const TaskCreateForm = (props: TaskCreateFormProps) => {
  const [form] = Form.useForm();
  const isEdit = Boolean(props.task);

  const { data: projectListData } = useQuery({
    queryKey: [...queryKey.project.list(), 'task-create'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });

  const projectOptions = (projectListData?.items ?? []).map(
    (item: Project) => ({
      label: item.name,
      value: item.id,
    }),
  );

  const statusOptions = useMemo(() => {
    if (props.statusConfigs && props.statusConfigs.length > 0) {
      const options = props.statusConfigs.map((item) => {
        return {
          label: item.name,
          value: item.code,
        };
      });

      const taskStatusExists = props.task?.status
        ? props.statusConfigs.some((item) => item.code === props.task?.status)
        : true;

      if (taskStatusExists) {
        return options;
      }

      if (!props.task?.status) {
        return options;
      }

      return [
        ...options,
        {
          label: `${props.task.status}（历史状态）`,
          value: props.task.status,
          disabled: true,
        },
      ];
    }

    const options = [...TaskStatusOptions];

    if (props.task?.status !== TaskStatus.Canceled) {
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
  }, [props.statusConfigs, props.task?.status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      form.focusField('title');
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      style={{ height: '100%' }}
      initialValues={{
        projectId:
          props.task?.projectId ??
          props.projectId ??
          getRememberedProjectIdFromStorage(),
        title: props.task?.title,
        description: props.task?.description,
        assigneeId: props.task?.assigneeId ?? props.defaultAssigneeId,
        status: props.task?.status ?? TaskStatus.Todo,
        priority: props.task?.priority ?? TaskPriority.Low,
        workDays: props.task?.workDays,
        startTime: props.task?.startTime
          ? dayjs(props.task.startTime)
          : undefined,
        dueTime: props.task?.dueTime ? dayjs(props.task.dueTime) : undefined,
      }}
      onFinish={async (values) => {
        const params = {
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          workDays: values.workDays,
          assigneeId: getSubmitAssigneeId(values.assigneeId),
          startTime: values.startTime
            ? dayjs(values.startTime).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          dueTime: values.dueTime
            ? dayjs(values.dueTime).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
        };

        if (isEdit && props.task) {
          await ApiProjectTask.edit(
            props.task.id,
            params as EditProjectTaskParams,
          );
          return true;
        }

        await ApiProjectTask.create({
          projectId: values.projectId,
          ...(params as Omit<CreateProjectTaskParams, 'projectId'>),
        });

        saveRememberedProjectIdToStorage(values.projectId);
        return true;
      }}
    >
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <Row gutter={16} align={'stretch'} style={{ height: '100%' }}>
          {/* 左侧：标题 + 描述 */}
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
                <Input
                  placeholder={'请输入任务标题'}
                  maxLength={128}
                  showCount
                />
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

                <Form.Item name={'description'} noStyle>
                  <KMarkdownEditor
                    placeholder={'请输入任务详情，支持 Markdown 和粘贴图片上传'}
                    height={520}
                    toolbarPreset={'compact'}
                  />
                </Form.Item>
              </div>
            </div>
          </Col>

          {/* 右侧：项目、负责人、状态、优先级、开始时间、截止时间 */}
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
              <Form.Item
                name={'projectId'}
                label={'项目'}
                rules={[{ required: true, message: '请选择项目' }]}
              >
                <Select
                  placeholder={'请选择项目'}
                  options={projectOptions}
                  disabled={Boolean(props.projectId) || isEdit}
                  showSearch={{
                    optionFilterProp: 'label',
                  }}
                />
              </Form.Item>

              <Form.Item name={'assigneeId'} label={'负责人'}>
                <UserSelect />
              </Form.Item>

              <Form.Item
                name={'status'}
                label={'状态'}
                rules={[{ required: true, message: '请选择任务状态' }]}
              >
                <Select placeholder={'请选择状态'} options={statusOptions} />
              </Form.Item>

              <Form.Item
                name={'priority'}
                label={'优先级'}
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select
                  placeholder={'请选择优先级'}
                  options={TaskPriorityOptions}
                />
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

                      throw new Error(
                        '预计工时必须大于 0 且按 0.5 人天递增',
                      );
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
    </KModal.Form>
  );
};

export default TaskCreateForm;
