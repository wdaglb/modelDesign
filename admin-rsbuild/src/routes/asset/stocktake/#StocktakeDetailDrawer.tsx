import { useState } from 'react';
import {
  Button,
  Descriptions,
  Flex,
  InputNumber,
  Space,
  Typography,
  message,
} from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetStocktake } from '@/api';
import type {
  AssetStocktakeDetailItem,
  AssetStocktakeTaskItem,
} from '@/api/modules/asset-stocktake';
import { KTable } from '@/components';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import usePermission from '@/hooks/usePermission';

import {
  STOCKTAKE_RESULT,
  STOCKTAKE_TASK_STATUS,
  getDifferenceText,
  getNumberText,
  getResultStatusTag,
  getTaskStatusTag,
} from './#stocktakeDisplay';

interface StocktakeDetailDrawerProps {
  /**
   * 当前盘点任务。
   */
  record: AssetStocktakeTaskItem;
}

/**
 * 盘点任务详情抽屉组件。
 */
const StocktakeDetailDrawer = (props: StocktakeDetailDrawerProps) => {
  const { record } = props;
  const [summary, setSummary] = useState(record);
  const [quantityMap, setQuantityMap] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();
  const { hasButtonPermission } = usePermission();
  const detailQueryKey = queryKey.asset.stocktakeDetail(record.id);
  const isFinished = summary.status === STOCKTAKE_TASK_STATUS.finished;
  const canManage = hasButtonPermission(
    PERMISSION_RESOURCE.assetStocktakeManage,
  );

  /**
   * 刷新盘点任务列表和当前明细，保证抽屉内外统计同步。
   */
  const refreshStocktakeQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.asset.stocktakeList(),
      }),
      queryClient.invalidateQueries({
        queryKey: detailQueryKey,
      }),
    ]);
  };

  /**
   * 提交单台设备盘点结果。
   *
   * @param item 盘点明细
   * @param resultStatus 结果状态
   */
  const submitResult = async (
    item: AssetStocktakeDetailItem,
    resultStatus: number,
  ) => {
    const actualQuantity = resolveActualQuantity(item, resultStatus);
    await ApiAssetStocktake.check({
      taskId: record.id,
      deviceId: item.deviceId,
      resultStatus,
      actualQuantity,
    });
    updateSummaryAfterResult(item.resultStatus, resultStatus);
    await refreshStocktakeQueries();
  };

  /**
   * 解析本次提交的实际数量。
   *
   * @param item 盘点明细
   * @param resultStatus 盘点结果
   * @returns 实际数量
   */
  const resolveActualQuantity = (
    item: AssetStocktakeDetailItem,
    resultStatus: number,
  ) => {
    if (resultStatus === STOCKTAKE_RESULT.missing) {
      return 0;
    }
    const cachedQuantity = quantityMap[item.id];
    if (cachedQuantity !== undefined) {
      return cachedQuantity;
    }
    if (item.actualQuantity !== undefined && item.actualQuantity !== null) {
      return item.actualQuantity;
    }
    if (item.expectedQuantity !== undefined && item.expectedQuantity !== null) {
      return item.expectedQuantity;
    }
    return 1;
  };

  /**
   * 根据单条明细的结果变化增量更新顶部统计。
   *
   * @param previousResult 原结果
   * @param nextResult 新结果
   */
  const updateSummaryAfterResult = (
    previousResult: number | undefined,
    nextResult: number,
  ) => {
    setSummary((current) => {
      let checkedCount = current.checkedCount ?? 0;
      let foundCount = current.foundCount ?? 0;
      let missingCount = current.missingCount ?? 0;

      if (previousResult === undefined || previousResult === null) {
        checkedCount += 1;
      }
      if (previousResult === STOCKTAKE_RESULT.found) {
        foundCount -= 1;
      }
      if (previousResult === STOCKTAKE_RESULT.missing) {
        missingCount -= 1;
      }
      if (nextResult === STOCKTAKE_RESULT.found) {
        foundCount += 1;
      }
      if (nextResult === STOCKTAKE_RESULT.missing) {
        missingCount += 1;
      }

      return {
        ...current,
        checkedCount,
        foundCount,
        missingCount,
      };
    });
  };

  /**
   * 完成盘点任务。
   */
  const completeTask = async () => {
    try {
      const nextSummary = await ApiAssetStocktake.complete(record.id);
      setSummary(nextSummary);
      await refreshStocktakeQueries();
      message.success('盘点任务已完成');
    } catch {
      message.error('完成盘点失败，请确认所有设备都已登记结果');
    }
  };

  return (
    <Flex vertical gap={16} style={{ minHeight: 0, flex: 1 }}>
      <Descriptions
        bordered
        size={'small'}
        column={2}
        items={[
          {
            key: 'name',
            label: '任务名称',
            children: summary.name,
          },
          {
            key: 'status',
            label: '状态',
            children: getTaskStatusTag(summary.status),
          },
          {
            key: 'totalCount',
            label: '设备总数',
            children: getNumberText(summary.totalCount),
          },
          {
            key: 'checkedCount',
            label: '已登记',
            children: getNumberText(summary.checkedCount),
          },
          {
            key: 'foundCount',
            label: '盘到',
            children: getNumberText(summary.foundCount),
          },
          {
            key: 'missingCount',
            label: '未找到',
            children: getNumberText(summary.missingCount),
          },
        ]}
      />

      <Flex justify={'space-between'} align={'center'}>
        <Typography.Text strong>盘点明细</Typography.Text>
        {canManage && (
          <Button type={'primary'} disabled={isFinished} onClick={completeTask}>
            完成盘点
          </Button>
        )}
      </Flex>

      <KTable<AssetStocktakeDetailItem>
        queryKey={detailQueryKey}
        request={() => ApiAssetStocktake.getDetail(record.id)}
        rowKey={'id'}
        pagination={false}
        scroll={{ y: 420 }}
        columns={[
          {
            title: '资产编号',
            dataIndex: 'assetCode',
            key: 'assetCode',
            width: 140,
          },
          {
            title: '设备名称',
            dataIndex: 'deviceName',
            key: 'deviceName',
            width: 160,
          },
          {
            title: '账面数量',
            dataIndex: 'expectedQuantity',
            key: 'expectedQuantity',
            width: 100,
            render: (value) => getNumberText(value),
          },
          {
            title: '实际数量',
            dataIndex: 'actualQuantity',
            key: 'actualQuantity',
            width: 120,
            render: (value, item) => {
              let nextValue = value;
              if (quantityMap[item.id] !== undefined) {
                nextValue = quantityMap[item.id];
              }

              return (
                <InputNumber
                  min={0}
                  precision={0}
                  disabled={isFinished}
                  value={nextValue}
                  placeholder={'数量'}
                  onChange={(inputValue) => {
                    if (typeof inputValue !== 'number') {
                      return;
                    }

                    setQuantityMap((current) => ({
                      ...current,
                      [item.id]: inputValue,
                    }));
                  }}
                />
              );
            },
          },
          {
            title: '数量差异',
            dataIndex: 'differenceQuantity',
            key: 'differenceQuantity',
            width: 100,
            render: (value) => getDifferenceText(value),
          },
          {
            title: '账面位置',
            dataIndex: 'expectedLocationId',
            key: 'expectedLocationId',
            width: 110,
            render: (value) => getNumberText(value),
          },
          {
            title: '账面使用人',
            dataIndex: 'expectedUserId',
            key: 'expectedUserId',
            width: 120,
            render: (value) => getNumberText(value),
          },
          {
            title: '盘点结果',
            dataIndex: 'resultStatus',
            key: 'resultStatus',
            width: 110,
            render: (value) => getResultStatusTag(value),
          },
          {
            title: '盘点时间',
            dataIndex: 'checkedAt',
            key: 'checkedAt',
            width: 180,
            render: (value) => value || '-',
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, item) => (
              <Space>
                <KTable.Button
                  size={'small'}
                  disabled={isFinished}
                  permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
                  onClick={async () => {
                    await submitResult(item, STOCKTAKE_RESULT.found);
                  }}
                >
                  盘到
                </KTable.Button>
                <KTable.Button
                  size={'small'}
                  danger
                  disabled={isFinished}
                  permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
                  onClick={async () => {
                    await submitResult(item, STOCKTAKE_RESULT.missing);
                  }}
                >
                  未找到
                </KTable.Button>
              </Space>
            ),
          },
        ]}
      />
    </Flex>
  );
};

export default StocktakeDetailDrawer;
