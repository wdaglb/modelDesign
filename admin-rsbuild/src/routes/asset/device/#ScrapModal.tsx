import { Form, Input } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import type { AssetDeviceItem } from '@/api/modules/asset-device';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface ScrapModalProps {
  /**
   * 当前设备记录。
   */
  record: AssetDeviceItem;
}

/**
 * 设备报废表单。
 */
const ScrapModal = (props: ScrapModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetDevice.scrap({
          id: props.record.id,
          ...values,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.deviceList(),
        });
      }}
    >
      <Form.Item name={'remark'} label={'报废备注'}>
        <Input.TextArea placeholder={'请输入报废备注'} rows={4} />
      </Form.Item>
    </KModal.Form>
  );
};

export default ScrapModal;
