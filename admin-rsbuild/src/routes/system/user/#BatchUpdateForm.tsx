import React from 'react';
import { Form, Radio, Typography } from 'antd';

import { ApiUser } from '@/api';
import KModal from '@/components/KModal';

interface BatchUpdateFormProps {
  /**
   * 当前批量操作选中的用户 ID 列表。
   */
  ids: number[];
}

/**
 * 批量修改用户状态表单。
 *
 * 第一版仅支持批量启用/禁用，避免把批量修改范围做得过大，
 * 降低误操作风险，同时与当前后端接口能力保持一致。
 */
const BatchUpdateForm = ({ ids }: BatchUpdateFormProps) => {
  const [form] = Form.useForm();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{ isDisable: false }}
      onFinish={async (values) => {
        await ApiUser.batchUpdateStatus({
          ids,
          isDisable: values.isDisable,
        });
      }}
    >
      <Typography.Text type={'secondary'}>
        已选择 {ids.length} 个用户，请选择要批量更新的状态。
      </Typography.Text>

      <Form.Item
        name={'isDisable'}
        label={'目标状态'}
        rules={[{ required: true, message: '请选择目标状态' }]}
        style={{ marginTop: 16 }}
      >
        <Radio.Group
          optionType={'button'}
          options={[
            { label: '启用', value: false },
            { label: '禁用', value: true },
          ]}
        />
      </Form.Item>
    </KModal.Form>
  );
};

export default BatchUpdateForm;
