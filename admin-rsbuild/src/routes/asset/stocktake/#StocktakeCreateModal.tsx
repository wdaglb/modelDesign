import { Form, Input, Select } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice, ApiAssetStocktake } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

/**
 * 盘点任务创建表单。
 */
const StocktakeCreateModal = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const scopeType = Form.useWatch('scopeType', form);

  /**
   * 指定位置盘点需要位置下拉，默认全部盘点时不会提交位置约束。
   */
  const { data: locationOptions = [] } = useQuery({
    queryKey: queryKey.asset.locationOptions(),
    queryFn: ApiAssetDevice.getLocationOptions,
  });

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
        rules={[{ required: true, message: '请选择范围类型' }]}
      >
        <Select
          options={[
            { label: '全部设备', value: 1 },
            { label: '指定位置', value: 2 },
          ]}
        />
      </Form.Item>

      {scopeType === 2 && (
        <Form.Item
          name={'scopeLocationId'}
          label={'范围位置'}
          rules={[{ required: true, message: '请选择范围位置' }]}
        >
          <Select
            showSearch
            optionFilterProp={'label'}
            placeholder={'请选择范围位置'}
            options={locationOptions}
          />
        </Form.Item>
      )}

      <Form.Item name={'remark'} label={'备注'}>
        <Input.TextArea rows={3} maxLength={500} placeholder={'请输入备注'} />
      </Form.Item>
    </KModal.Form>
  );
};

export default StocktakeCreateModal;
