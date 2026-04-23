import { Form, Input, InputNumber } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetLocation } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

/**
 * 位置表单。
 */
const LocationFormModal = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetLocation.create(values);
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.locationList(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'位置名称'}
        rules={[{ required: true, message: '请输入位置名称' }]}
      >
        <Input placeholder={'请输入位置名称'} />
      </Form.Item>

      <Form.Item
        name={'code'}
        label={'位置编码'}
        rules={[{ required: true, message: '请输入位置编码' }]}
      >
        <Input placeholder={'请输入位置编码'} />
      </Form.Item>

      <Form.Item
        name={'parentId'}
        label={'父级位置 ID'}
        initialValue={0}
        rules={[{ required: true, message: '请输入父级位置 ID' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default LocationFormModal;
