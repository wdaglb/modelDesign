import React, { Key, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Flex, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiAssetCategory } from '@/api';
import type { AssetCategoryItem } from '@/api/modules/asset-category';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import CategoryDeleteModal from './#CategoryDeleteModal';
import CategoryFormModal from './#CategoryFormModal';

/**
 * 渲染分类状态标签。
 *
 * @param status 分类状态
 * @returns 状态标签
 */
function renderStatus(status: number) {
  if (status === 1) {
    return <Tag color={'success'}>启用</Tag>;
  }
  return <Tag>停用</Tag>;
}

/**
 * 设备分类表格。
 *
 * @returns 设备分类管理表格
 */
const CategoryTable = () => {
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  /**
   * 删除成功后统一刷新列表与分类下拉。
   *
   * 删除会直接影响分类列表展示与设备表单里的分类可选项，
   * 因此这里集中刷新两个查询，避免各删除入口重复遗漏。
   */
  const refreshCategoryQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKey.asset.categoryList(),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKey.asset.categoryOptions(),
    });
  };

  /**
   * 打开删除弹窗，并在删除成功后刷新分类数据。
   *
   * 单条删除和批量删除统一复用同一个弹窗组件，
   * 这样可以保证“先检查引用、再执行删除”的流程完全一致。
   */
  const openDeleteModal = async (ids: number[]) => {
    await modal.open({
      title: ids.length > 1 ? '批量删除分类' : '删除分类',
      width: 560,
      children: <CategoryDeleteModal ids={ids} />,
    });
    await refreshCategoryQueries();
  };

  const columns: TableColumnsType<AssetCategoryItem> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序值',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: renderStatus,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => {
        return (
          <Space>
            <KTable.Button
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.assetCategoryManage}
              onClick={async () => {
                await modal.open({
                  title: '编辑分类',
                  width: 520,
                  children: <CategoryFormModal record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.Button
              size={'small'}
              color={'danger'}
              variant={'filled'}
              permissionCode={PERMISSION_RESOURCE.assetCategoryDelete}
              onClick={async () => {
                await openDeleteModal([record.id]);
              }}
            >
              删除
            </KTable.Button>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<AssetCategoryItem>
      queryKey={queryKey.asset.categoryList()}
      request={ApiAssetCategory.getList}
      rowKey={'id'}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space>
            <KTable.Button
              color={'danger'}
              variant={'filled'}
              permissionCode={PERMISSION_RESOURCE.assetCategoryDelete}
              disabled={selectedRowKeys.length === 0}
              onClick={async () => {
                await openDeleteModal(
                  selectedRowKeys
                    .map((item) => Number(item))
                    .filter(Boolean),
                );
                setSelectedRowKeys([]);
              }}
            >
              批量删除
            </KTable.Button>
          </Space>

          <Space>
            <KTable.Button
              type={'primary'}
              icon={<Icons.Plus />}
              permissionCode={PERMISSION_RESOURCE.assetCategoryManage}
              onClick={async () => {
                await modal.open({
                  title: '新建分类',
                  width: 520,
                  children: <CategoryFormModal />,
                });
              }}
            >
              新建分类
            </KTable.Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default CategoryTable;
