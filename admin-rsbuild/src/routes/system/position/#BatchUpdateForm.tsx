import React from 'react';
import { Form, Radio, Typography } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiPosition } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface BatchUpdateFormProps {
  /**
   * 当前批量操作选中的职位 ID 列表。
   */
  ids: number[];
}

/**
 * 批量修改职位状态表单。
 */
const BatchUpdateForm = ({ ids }: BatchUpdateFormProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{ isDisable: false }}
      onFinish={async (values) => {
        await ApiPosition.batchUpdateStatus({
          ids,
          isDisable: values.isDisable,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.position.list(),
        });
      }}
    >
      <Typography.Text type={'secondary'}>
        已选择 {ids.length} 个职位，请选择要批量更新的状态。
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
