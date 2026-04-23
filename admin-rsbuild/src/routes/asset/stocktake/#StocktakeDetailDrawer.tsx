import type { AssetStocktakeTaskItem } from '@/api/modules/asset-stocktake';

interface StocktakeDetailDrawerProps {
  /**
   * 当前盘点任务。
   */
  record: AssetStocktakeTaskItem;
}

/**
 * 盘点任务详情抽屉占位组件。
 *
 * 第一版先保留独立文件边界，后续再补详情展示和差异校正交互。
 */
const StocktakeDetailDrawer = (_props: StocktakeDetailDrawerProps) => {
  return null;
};

export default StocktakeDetailDrawer;
