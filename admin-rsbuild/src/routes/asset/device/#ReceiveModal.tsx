import { Form, InputNumber } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import type { AssetDeviceItem } from '@/api/modules/asset-device';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface ReceiveModalProps {
  /**
   * 当前设备记录。
   */
  record: AssetDeviceItem;
}

/**
 * 设备领用表单。
 */
const ReceiveModal = (props: ReceiveModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetDevice.receive({
          id: props.record.id,
          ...values,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.deviceList(),
        });
      }}
    >
      <Form.Item
        name={'currentUserId'}
        label={'领用人 ID'}
        rules={[{ required: true, message: '请输入领用人 ID' }]}
      >
        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default ReceiveModal;
