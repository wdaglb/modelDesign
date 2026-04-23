/**
 * 设备台账查询键。
 */
export const deviceList = () => ['assetDeviceList'];

/**
 * 位置列表查询键。
 */
export const locationList = () => ['assetLocationList'];

/**
 * 盘点任务列表查询键。
 */
export const stocktakeList = () => ['assetStocktakeList'];

/**
 * 盘点任务详情查询键。
 */
export const stocktakeDetail = (id: number) => ['assetStocktakeDetail', id];

/**
 * 用户下拉查询键。
 */
export const userOptions = () => ['assetUserOptions'];

/**
 * 位置下拉查询键。
 */
export const locationOptions = () => ['assetLocationOptions'];

/**
 * 分类下拉查询键。
 */
export const categoryOptions = () => ['assetCategoryOptions'];
