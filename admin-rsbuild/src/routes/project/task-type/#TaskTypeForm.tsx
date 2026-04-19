import { Form, Input, InputNumber } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiProjectTaskType } from '@/api';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface TaskTypeFormProps {
  /**
   * 编辑时传入的类型记录。
   */
  record?: ProjectTaskType;
}

interface TaskTypeFormValues {
  /**
   * 类型名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;
}

/**
 * 任务类型新增/编辑表单。
 */
const TaskTypeForm = (props: TaskTypeFormProps) => {
  const [form] = Form.useForm<TaskTypeFormValues>();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        name: props.record?.name,
        sort: props.record?.sort ?? 0,
      }}
      onFinish={async (values) => {
        const payload = {
          name: values.name.trim(),
          sort: values.sort,
        };

        if (props.record) {
          await ApiProjectTaskType.edit(props.record.id, payload);
        } else {
          await ApiProjectTaskType.create(payload);
        }

        await queryClient.invalidateQueries({
          queryKey: queryKey.project.taskTypeList(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'类型名称'}
        rules={[{ required: true, message: '请输入类型名称' }]}
      >
        <Input placeholder={'请输入类型名称'} autoFocus maxLength={64} showCount />
      </Form.Item>

      <Form.Item
        name={'sort'}
        label={'排序'}
        rules={[{ required: true, message: '请输入排序值' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default TaskTypeForm;
