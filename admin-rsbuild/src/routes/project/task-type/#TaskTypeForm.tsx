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

  /**
   * Git 分支前缀分组。
   */
  gitBranchPrefixGroup?: string;
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
        gitBranchPrefixGroup: props.record?.gitBranchPrefixGroup,
      }}
      onFinish={async (values) => {
        const payload = {
          name: values.name.trim(),
          sort: values.sort,
          gitBranchPrefixGroup: normalizeGitBranchPrefixGroup(
            values.gitBranchPrefixGroup,
          ),
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

      <Form.Item
        name={'gitBranchPrefixGroup'}
        label={'Git 分支前缀分组'}
        rules={[{ max: 64, message: 'Git 分支前缀分组长度不能超过 64 个字符' }]}
        extra={'允许自由填写；留空后任务详情将提示当前任务类型未配置分支前缀。'}
      >
        <Input
          placeholder={'请输入 Git 分支前缀分组，例如 feat 或 bugfix'}
          maxLength={64}
          showCount
          allowClear
        />
      </Form.Item>
    </KModal.Form>
  );
};

/**
 * 统一规范化任务类型上的 Git 分支前缀分组输入。
 *
 * @param value 原始输入值
 * @returns 规范化后的分组值
 */
const normalizeGitBranchPrefixGroup = (value?: string) => {
  if (typeof value !== 'string') {
    return '';
  }
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return '';
  }
  return normalizedValue;
};

export default TaskTypeForm;
