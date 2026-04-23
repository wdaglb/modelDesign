import { Form, Input } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

/**
 * 设备入库表单。
 */
const DeviceFormModal = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetDevice.create(values);
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.deviceList(),
        });
      }}
    >
      <Form.Item
        name={'deviceName'}
        label={'设备名称'}
        rules={[{ required: true, message: '请输入设备名称' }]}
      >
        <Input placeholder={'请输入设备名称'} />
      </Form.Item>
    </KModal.Form>
  );
};

export default DeviceFormModal;
