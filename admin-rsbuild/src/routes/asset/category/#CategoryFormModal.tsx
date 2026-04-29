import { Form, Input, InputNumber, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetCategory } from '@/api';
import type {
  AssetCategoryItem,
  AssetCategorySaveData,
} from '@/api/modules/asset-category';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface CategoryFormModalProps {
  /**
   * 当前编辑记录；为空时表示新建分类。
   */
  record?: AssetCategoryItem;
}

/**
 * 设备分类表单弹窗。
 *
 * @param props 弹窗参数
 * @returns 分类保存表单
 */
const CategoryFormModal = (props: CategoryFormModalProps) => {
  const [form] = Form.useForm<AssetCategorySaveData>();
  const queryClient = useQueryClient();

  /**
   * 新建时默认启用；编辑时沿用后端返回值。
   */
  const initialValues: AssetCategorySaveData = {
    status: 1,
    sort: 1,
  };
  if (props.record) {
    initialValues.name = props.record.name;
    initialValues.sort = props.record.sort;
    initialValues.status = props.record.status;
    initialValues.remark = props.record.remark;
  }

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={initialValues}
      onFinish={async (values) => {
        if (props.record) {
          await ApiAssetCategory.edit(props.record.id, values);
        } else {
          await ApiAssetCategory.create(values);
        }
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.categoryList(),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.categoryOptions(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'分类名称'}
        rules={[{ required: true, message: '请输入分类名称' }]}
      >
        <Input placeholder={'请输入分类名称'} maxLength={100} />
      </Form.Item>

      <Form.Item
        name={'sort'}
        label={'排序值'}
        rules={[{ required: true, message: '请输入排序值' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name={'status'}
        label={'状态'}
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Radio.Group
          optionType={'button'}
          options={[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]}
        />
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

export default CategoryFormModal;
