import React from 'react';
import { Button, Form, Input, InputNumber, Select, Space } from 'antd';

import type { UserFilterValues } from './#userQueryHelper';
import { AdvancedFilterGrid } from './#user.styled';

interface UserAdvancedFilterProps {
  /**
   * 是否展开。
   */
  open: boolean;

  /**
   * 当前筛选值。
   */
  value: UserFilterValues;

  /**
   * 筛选值变更。
   */
  onChange: (value: UserFilterValues) => void;

  /**
   * 应用筛选。
   */
  onApply: () => void;

  /**
   * 重置筛选。
   */
  onReset: () => void;
}

/**
 * 用户管理高级筛选面板。
 */
const UserAdvancedFilter = ({
  open,
  value,
  onChange,
  onApply,
  onReset,
}: UserAdvancedFilterProps) => {
  if (!open) {
    return null;
  }

  return (
    <Form layout={'vertical'}>
      <AdvancedFilterGrid>
        <Form.Item label={'用户名'}>
          <Input
            placeholder={'按用户名筛选'}
            value={value.username}
            onChange={(event) => {
              onChange({ ...value, username: event.target.value });
            }}
          />
        </Form.Item>

        <Form.Item label={'昵称'}>
          <Input
            placeholder={'按昵称筛选'}
            value={value.nickname}
            onChange={(event) => {
              onChange({ ...value, nickname: event.target.value });
            }}
          />
        </Form.Item>

        <Form.Item label={'用户 ID'}>
          <InputNumber
            min={1}
            precision={0}
            placeholder={'按用户 ID'}
            style={{ width: '100%' }}
            value={value.userId}
            onChange={(nextValue) => {
              if (typeof nextValue === 'number') {
                if (Number.isFinite(nextValue)) {
                  onChange({ ...value, userId: nextValue });
                  return;
                }
              }
              onChange({ ...value, userId: undefined });
            }}
          />
        </Form.Item>

        <Form.Item label={'状态'}>
          <Select
            allowClear
            placeholder={'全部状态'}
            value={value.isDisable}
            onChange={(nextValue) => {
              onChange({ ...value, isDisable: nextValue });
            }}
            options={[
              { label: '启用', value: false },
              { label: '禁用', value: true },
            ]}
          />
        </Form.Item>
      </AdvancedFilterGrid>

      <Space>
        <Button type={'primary'} onClick={onApply}>
          应用筛选
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form>
  );
};

export default UserAdvancedFilter;
