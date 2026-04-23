import { Form, Input, InputNumber } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetStocktake } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

/**
 * 盘点任务创建表单。
 */
const StocktakeCreateModal = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        scopeType: 1,
      }}
      onFinish={async (values) => {
        await ApiAssetStocktake.create(values);
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.stocktakeList(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'任务名称'}
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input placeholder={'请输入任务名称'} />
      </Form.Item>

      <Form.Item
        name={'scopeType'}
        label={'范围类型'}
        rules={[{ required: true, message: '请输入范围类型' }]}
      >
        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default StocktakeCreateModal;
