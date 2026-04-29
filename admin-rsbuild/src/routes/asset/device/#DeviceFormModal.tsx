import { DatePicker, Form, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import type { AssetDeviceCreateData } from '@/api/modules/asset-device';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface DeviceFormValues {
  /**
   * 设备名称。
   */
  deviceName: string;

  /**
   * 分类 ID。
   */
  categoryId: number;

  /**
   * 资产编号。
   */
  assetCode: string;

  /**
   * 序列号。
   */
  serialNumber?: string;

  /**
   * 位置 ID。
   */
  locationId: number;

  /**
   * 购置日期，Ant Design DatePicker 在表单中返回 Dayjs 对象。
   */
  purchaseDate?: Dayjs;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 将表单值转换为后端入库接口需要的请求体。
 *
 * @param values 表单原始值
 * @returns 入库登记请求体
 */
export function buildDeviceCreatePayload(
  values: DeviceFormValues,
): AssetDeviceCreateData {
  const payload: AssetDeviceCreateData = {
    deviceName: values.deviceName,
    categoryId: values.categoryId,
    assetCode: values.assetCode,
    locationId: values.locationId,
  };

  /**
   * 可选字段只有在用户填写后再提交，避免空字符串覆盖后端默认处理。
   */
  if (values.serialNumber) {
    payload.serialNumber = values.serialNumber;
  }
  if (values.purchaseDate) {
    payload.purchaseDate = values.purchaseDate.format('YYYY-MM-DD');
  }
  if (values.remark) {
    payload.remark = values.remark;
  }

  return payload;
}

/**
 * 设备入库表单。
 */
const DeviceFormModal = () => {
  const [form] = Form.useForm<DeviceFormValues>();
  const queryClient = useQueryClient();
  const categoryQuery = useQuery({
    queryKey: queryKey.asset.categoryOptions(),
    queryFn: ApiAssetDevice.getCategoryOptions,
  });
  const locationQuery = useQuery({
    queryKey: queryKey.asset.locationOptions(),
    queryFn: ApiAssetDevice.getLocationOptions,
  });

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiAssetDevice.create(buildDeviceCreatePayload(values));
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

      <Form.Item
        name={'categoryId'}
        label={'设备分类'}
        rules={[{ required: true, message: '请选择设备分类' }]}
      >
        <Select
          showSearch
          loading={categoryQuery.isFetching}
          placeholder={'请选择设备分类'}
          optionFilterProp={'label'}
          options={categoryQuery.data ?? []}
        />
      </Form.Item>

      <Form.Item
        name={'assetCode'}
        label={'资产编号'}
        rules={[{ required: true, message: '请输入资产编号' }]}
      >
        <Input placeholder={'请输入资产编号'} />
      </Form.Item>

      <Form.Item name={'serialNumber'} label={'序列号'}>
        <Input placeholder={'请输入序列号'} />
      </Form.Item>

      <Form.Item
        name={'locationId'}
        label={'所在位置'}
        rules={[{ required: true, message: '请选择所在位置' }]}
      >
        <Select
          showSearch
          loading={locationQuery.isFetching}
          placeholder={'请选择所在位置'}
          optionFilterProp={'label'}
          options={locationQuery.data ?? []}
        />
      </Form.Item>

      <Form.Item name={'purchaseDate'} label={'购置日期'}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={'remark'} label={'备注'}>
        <Input.TextArea
          rows={3}
          maxLength={500}
          showCount
          placeholder={'请输入备注'}
        />
      </Form.Item>
    </KModal.Form>
  );
};

export default DeviceFormModal;
