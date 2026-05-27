import React, { useMemo } from 'react';
import { Form, Select, Space, Typography } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiAssetCategory } from '@/api';
import type {
  AssetCategoryDeleteCheckResult,
  AssetCategoryDeleteData,
} from '@/api/modules/asset-category';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface CategoryDeleteModalProps {
  /**
   * 当前待删除的分类 ID 列表。
   */
  ids: number[];
}

interface DeleteFormValues {
  /**
   * 迁移目标分类 ID。
   */
  transferCategoryId?: number;
}

/**
 * 分类删除弹窗。
 *
 * 这里统一承载单条删除和批量删除：
 * - 先查询引用情况
 * - 若存在设备引用，则要求先选择迁移目标分类
 * - 提交时再真正执行删除，避免前端用静态提示替代后端实时校验
 */
const CategoryDeleteModal = ({ ids }: CategoryDeleteModalProps) => {
  const [form] = Form.useForm<DeleteFormValues>();
  const queryClient = useQueryClient();
  const isBatchDelete = ids.length > 1;
  const { data, isLoading } = useQuery<AssetCategoryDeleteCheckResult>({
    queryKey: [...queryKey.asset.categoryList(), 'delete-check', ids],
    queryFn: () => {
      return ApiAssetCategory.deleteCheck({ ids });
    },
  });

  /**
   * 使用后端最新检查结果决定是否需要迁移。
   *
   * 这样可以避免用户在弹窗打开期间遇到引用变化时，前端仍沿用旧状态误导提交。
   */
  const needTransfer = Boolean(data?.needTransfer);
  const itemSummary = useMemo(() => {
    if (!data?.items?.length) {
      return '正在检查待删除分类的引用情况。';
    }

    return data.items
      .map((item) => {
        if (item.referenceCount > 0) {
          return `${item.name}（引用 ${item.referenceCount} 台设备）`;
        }
        return `${item.name}（无设备引用）`;
      })
      .join('、');
  }, [data]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        const deleteData: AssetCategoryDeleteData = {
          ids,
        };
        if (needTransfer) {
          deleteData.transferCategoryId = values.transferCategoryId;
        }

        await ApiAssetCategory.deleteCategory(deleteData);
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.categoryList(),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.asset.categoryOptions(),
        });
      }}
    >
      <Space orientation={'vertical'} size={12} style={{ width: '100%' }}>
        <Typography.Text>
          {isBatchDelete
            ? `当前已选择 ${ids.length} 个分类进行批量删除。`
            : '删除后分类本身不可恢复，请确认本次删除操作。'}
        </Typography.Text>

        <Typography.Text type={'secondary'}>{itemSummary}</Typography.Text>

        {needTransfer ? (
          <>
            <Typography.Text type={'warning'}>
              检测到待删除分类仍被设备引用，请先选择统一迁移目标分类。
            </Typography.Text>

            <Form.Item
              name={'transferCategoryId'}
              label={'迁移目标分类'}
              rules={[{ required: true, message: '请选择迁移目标分类' }]}
            >
              <Select
                loading={isLoading}
                placeholder={'请选择迁移目标分类'}
                options={data?.transferOptions || []}
              />
            </Form.Item>
          </>
        ) : (
          <Typography.Text type={'secondary'}>
            当前待删除分类没有设备引用，可直接删除。
          </Typography.Text>
        )}
      </Space>
    </KModal.Form>
  );
};

export default CategoryDeleteModal;
