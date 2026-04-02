import React from 'react';
import { Form, Input, InputNumber, Radio, Select } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiPosition, ApiTenant } from '@/api';
import type { Position } from '@/api/modules/position';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

import { buildTenantSelectOptions } from './#tenantHelper';

interface UpdatePositionFormProps {
  /**
   * 当前编辑中的职位记录。
   */
  record: Position;
}

/**
 * 职位修改表单。
 */
const UpdatePositionForm = ({ record }: UpdatePositionFormProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: tenantOptionsData = [], isLoading: tenantLoading } = useQuery({
    queryKey: queryKey.tenant.options(),
    queryFn: ApiTenant.getOptions,
  });

  const tenantOptions = buildTenantSelectOptions(
    tenantOptionsData,
    record.tenantId,
    record.tenantName,
  );

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        tenantId: record.tenantId,
        name: record.name,
        code: record.code,
        sort: record.sort,
        remark: record.remark,
        isDisable: record.isDisable ?? false,
      }}
      onFinish={async (values) => {
        await ApiPosition.update(record.id, {
          tenantId: values.tenantId,
          name: values.name.trim(),
          code: values.code.trim(),
          sort: values.sort,
          remark: values.remark?.trim() || undefined,
          isDisable: values.isDisable,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.position.list(),
        });
      }}
    >
      <Form.Item
        name={'tenantId'}
        label={'所属租户'}
        rules={[{ required: true, message: '请选择所属租户' }]}
      >
        <Select
          showSearch
          loading={tenantLoading}
          options={tenantOptions}
          placeholder={'请选择所属租户'}
          optionFilterProp={'label'}
        />
      </Form.Item>

      <Form.Item
        name={'name'}
        label={'职位名称'}
        rules={[{ required: true, message: '请输入职位名称' }]}
      >
        <Input placeholder={'请输入职位名称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'code'}
        label={'职位编码'}
        rules={[{ required: true, message: '请输入职位编码' }]}
      >
        <Input placeholder={'请输入职位编码'} />
      </Form.Item>

      <Form.Item
        name={'sort'}
        label={'排序'}
        rules={[{ required: true, message: '请输入排序值' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={'remark'} label={'备注'}>
        <Input.TextArea placeholder={'请输入备注'} rows={4} />
      </Form.Item>

      <Form.Item
        name={'isDisable'}
        label={'状态'}
        rules={[{ required: true, message: '请选择状态' }]}
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

export default UpdatePositionForm;
