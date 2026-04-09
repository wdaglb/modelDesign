import React from 'react';
import { Button, Input, Space, Typography } from 'antd';

interface UserToolbarProps {
  /**
   * 当前统一搜索关键字。
   */
  keyword: string;

  /**
   * 高级筛选是否展开。
   */
  advancedOpen: boolean;

  /**
   * 当前选中的行数。
   */
  selectedCount: number;

  /**
   * 关键字变化回调。
   */
  onKeywordChange: (value: string) => void;

  /**
   * 搜索回调。
   */
  onSearch: (value: string) => void;

  /**
   * 展开或收起高级筛选。
   */
  onToggleAdvanced: () => void;

  /**
   * 打开新增用户弹窗。
   */
  onOpenCreate: () => void;

  /**
   * 打开批量操作弹窗。
   */
  onOpenBatch: () => void;
}

/**
 * 用户管理工具栏。
 */
const UserToolbar = ({
  keyword,
  advancedOpen,
  selectedCount,
  onKeywordChange,
  onSearch,
  onToggleAdvanced,
  onOpenCreate,
  onOpenBatch,
}: UserToolbarProps) => {
  let advancedButtonText = '高级筛选';
  if (advancedOpen) {
    advancedButtonText = '收起高级筛选';
  }

  return (
    <Space orientation={'vertical'} size={12} style={{ width: '100%' }}>
      <Space
        align={'start'}
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Space orientation={'vertical'} size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            用户管理
          </Typography.Title>
          <Typography.Text type={'secondary'}>
            管理账号、默认租户与绑定角色职位关系
          </Typography.Text>
        </Space>

        <Space>
          <Button disabled={selectedCount === 0} onClick={onOpenBatch}>
            批量操作
          </Button>
          <Button type={'primary'} onClick={onOpenCreate}>
            新增用户
          </Button>
        </Space>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          allowClear
          enterButton={'搜索'}
          placeholder={'搜索用户名 / 昵称 / 用户 ID'}
          style={{ width: 360 }}
          value={keyword}
          onChange={(event) => {
            onKeywordChange(event.target.value);
          }}
          onSearch={onSearch}
        />

        <Button onClick={onToggleAdvanced}>{advancedButtonText}</Button>
      </Space>
    </Space>
  );
};

export default UserToolbar;
