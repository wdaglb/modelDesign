import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Col, DatePicker, Form, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';

import { ApiProject, ApiProjectTask } from '@/api';
import type { Project } from '@/api/modules/project.types';
import {
  TaskPriority,
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusOptions,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import type { CreateProjectTaskParams } from '@/api/modules/project-task.types';
import { UserSelect } from '@/components';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface TaskCreateFormProps {
  /** 默认项目 ID。 */
  projectId?: number;
  /** 编辑时传入的任务详情。 */
  task?: ProjectTaskDetail;
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
        projectId: props.task?.projectId ?? props.projectId,
        title: props.task?.title,
        description: props.task?.description,
        assigneeId: props.task?.assigneeId,
        status: props.task?.status ?? TaskStatus.Todo,
        priority: props.task?.priority ?? TaskPriority.Low,
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
          assigneeId: values.assigneeId,
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
        return true;
      }}
    >
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <Row gutter={16} align={'stretch'} style={{ height: '100%' }}>
          {/* 左侧：标题 + 描述 */}
          <Col span={14} style={{ display: 'flex' }}>
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
                  任务描述
                </div>

                <Form.Item name={'description'} noStyle>
                  <Input.TextArea
                    placeholder={'请输入任务描述'}
                    style={{ flex: 1, minHeight: 0, resize: 'none' }}
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>
              </div>
            </div>
          </Col>

          {/* 右侧：项目、负责人、状态、优先级、开始时间、截止时间 */}
          <Col span={10} style={{ display: 'flex' }}>
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
                <Select
                  placeholder={'请选择状态'}
                  options={TaskStatusOptions}
                />
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
