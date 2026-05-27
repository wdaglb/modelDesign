import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';

import { ApiProjectTaskIteration } from '@/api';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import queryKey from '@/constants/queryKey';

import { buildDefaultTaskIterationName } from './#taskIterationNameHelper';

interface TaskIterationManagerProps {
  /** 当前迭代列表。 */
  iterations?: ProjectTaskIteration[];
  /** 迭代列表是否正在加载。 */
  loading?: boolean;
  /** 数据变更后刷新外部列表。 */
  onRefresh: () => Promise<void>;
}

interface TaskIterationFormValues {
  /** 迭代日期范围。 */
  dateRange?: [Dayjs, Dayjs];
  /** 迭代名称。 */
  name?: string;
  /** 是否已发布。 */
  published?: boolean;
}

/**
 * 敏捷面板内的任务迭代管理器。
 *
 * 管理入口仅承载在看板弹窗中，因此组件同时展示列表与轻量表单，
 * 避免为单一入口再新增独立路由与菜单。
 */
const TaskIterationManager = (props: TaskIterationManagerProps) => {
  const [form] = Form.useForm<TaskIterationFormValues>();
  const [editingIteration, setEditingIteration] = useState<ProjectTaskIteration>();
  const [isCreateNameManuallyChanged, setIsCreateNameManuallyChanged] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dateRange = Form.useWatch('dateRange', form);
  const iterationQuery = useQuery({
    queryKey: queryKey.project.taskIterationList(),
    queryFn: () => ApiProjectTaskIteration.getList(),
    enabled: props.iterations === undefined,
  });
  const iterations = props.iterations ?? iterationQuery.data ?? [];
  const loading = props.loading || iterationQuery.isFetching;

  /**
   * 在新建态下回填默认迭代名称。
   *
   * 这里只按日期范围起始日推导名称，保证用户修改结束日期时
   * 不会意外改变默认命名口径。
   *
   * @param referenceDate 参考日期
   */
  const fillDefaultName = useCallback((referenceDate?: Dayjs) => {
    form.setFieldValue(
      'name',
      buildDefaultTaskIterationName(referenceDate),
    );
  }, [form]);

  /**
   * 进入编辑态时把日期范围转换为 DatePicker 可识别的 Dayjs 值。
   *
   * @param iteration 待编辑迭代
   */
  const startEdit = (iteration: ProjectTaskIteration) => {
    setEditingIteration(iteration);
    setIsCreateNameManuallyChanged(false);
    form.setFieldsValue({
      name: iteration.name,
      dateRange: [dayjs(iteration.startDate), dayjs(iteration.endDate)],
      published: iteration.published,
    });
  };

  /**
   * 重置表单状态，确保下一次新增不会沿用上次编辑数据。
   */
  const resetForm = () => {
    setEditingIteration(undefined);
    setIsCreateNameManuallyChanged(false);
    form.resetFields();
  };

  /**
   * 新建态下根据当前日期或所选开始日期自动补默认名称。
   *
   * 只要用户已经手动改过名称，就停止自动覆盖，避免影响自定义输入。
   */
  useEffect(() => {
    if (editingIteration) {
      return;
    }

    if (isCreateNameManuallyChanged) {
      return;
    }

    const referenceDate = dateRange?.[0];
    fillDefaultName(referenceDate);
  }, [
    dateRange,
    editingIteration,
    fillDefaultName,
    isCreateNameManuallyChanged,
  ]);

  /**
   * 提交迭代新增或编辑。
   *
   * @param values 表单值
   */
  const handleSubmit = async (values: TaskIterationFormValues) => {
    if (!values.name || !values.dateRange) {
      message.error('请填写迭代名称和日期范围');
      return;
    }

    const params = {
      name: values.name.trim(),
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      published: Boolean(values.published),
    };

    setSubmitting(true);
    try {
      if (editingIteration) {
        await ApiProjectTaskIteration.edit(editingIteration.id, params);
        message.success('迭代已更新');
      } else {
        await ApiProjectTaskIteration.create(params);
        message.success('迭代已创建');
      }
      resetForm();
      await props.onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 删除迭代并刷新外部看板数据。
   *
   * @param id 迭代 ID
   */
  const handleDelete = async (id: number) => {
    await ApiProjectTaskIteration.deleted(id);
    message.success('迭代已删除');
    await props.onRefresh();
  };

  const columns: ColumnsType<ProjectTaskIteration> = [
    {
      title: '迭代名称',
      dataIndex: 'name',
    },
    {
      title: '发布状态',
      dataIndex: 'published',
      width: 100,
      render: (published: boolean) => {
        if (published) {
          return <Tag color="success">已发布</Tag>;
        }
        return <Tag>未发布</Tag>;
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      width: 130,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 130,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, item) => {
        return (
          <Space size={8}>
            <Button
              size="small"
              type="link"
              onClick={() => {
                startEdit(item);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除该迭代？"
              description="已被任务使用的迭代会由后端拦截删除。"
              onConfirm={async () => {
                await handleDelete(item.id);
              }}
            >
              <Button danger size="small" type="link">
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Form form={form} layout="inline" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          rules={[{ required: true, message: '请输入迭代名称' }]}
        >
          <Input
            maxLength={64}
            placeholder="迭代名称"
            showCount
            onChange={() => {
              if (!editingIteration) {
                setIsCreateNameManuallyChanged(true);
              }
            }}
          />
        </Form.Item>
        <Form.Item
          name="dateRange"
          rules={[{ required: true, message: '请选择迭代日期范围' }]}
        >
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item initialValue={false} name="published" valuePropName="checked">
          <Checkbox>已发布</Checkbox>
        </Form.Item>
        <Form.Item>
          <Space size={8}>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingIteration && '保存迭代'}
              {!editingIteration && '创建迭代'}
            </Button>
            {editingIteration && <Button onClick={resetForm}>取消编辑</Button>}
          </Space>
        </Form.Item>
      </Form>

      <Table<ProjectTaskIteration>
        columns={columns}
        dataSource={iterations}
        loading={loading}
        pagination={false}
        rowKey="id"
        size="small"
      />
    </Space>
  );
};

export default TaskIterationManager;
