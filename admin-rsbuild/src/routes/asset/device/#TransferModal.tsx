import { Form, InputNumber } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import type { AssetDeviceItem } from '@/api/modules/asset-device';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface TransferModalProps {
  /**
   * 当前设备记录。
   */
  record: AssetDeviceItem;
}

/**
 * 设备调拨表单。
 */
const TransferModal = (props: TransferModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetDevice.transfer({
          id: props.record.id,
          ...values,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.deviceList(),
        });
      }}
    >
      <Form.Item
        name={'locationId'}
        label={'目标位置 ID'}
        rules={[{ required: true, message: '请输入目标位置 ID' }]}
      >
        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
      </Form.Item>
    </KModal.Form>
  );
};

export default TransferModal;
