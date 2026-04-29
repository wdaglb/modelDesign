import request from '@/utils/request';

/**
 * 设备分类项。
 */
export interface AssetCategoryItem {
  /**
   * 分类 ID。
   */
  id: number;

  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 分类名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 状态，1 表示启用，0 表示停用。
   */
  status: number;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 分类保存参数。
 */
export interface AssetCategorySaveData {
  /**
   * 分类名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort?: number;

  /**
   * 状态，创建时后端默认启用，编辑时可显式传入。
   */
  status?: number;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 删除前检查请求。
 */
export interface AssetCategoryDeleteCheckData {
  /**
   * 待删除分类 ID 列表。
   */
  ids: number[];
}

/**
 * 删除前检查明细项。
 */
export interface AssetCategoryDeleteCheckItem {
  /**
   * 分类 ID。
   */
  id: number;

  /**
   * 分类名称。
   */
  name: string;

  /**
   * 引用数量。
   */
  referenceCount: number;

  /**
   * 是否需要先迁移引用后再删除。
   */
  needTransfer: boolean;
}

/**
 * 通用下拉选项。
 */
export interface AssetOptionItem {
  /**
   * 选项值。
   */
  value: number;

  /**
   * 选项文本。
   */
  label: string;
}

/**
 * 删除前检查响应。
 */
export interface AssetCategoryDeleteCheckResult {
  /**
   * 每个待删除分类的引用检查结果。
   */
  items: AssetCategoryDeleteCheckItem[];

  /**
   * 合计引用数量。
   */
  totalReferenceCount: number;

  /**
   * 是否需要先迁移引用。
   */
  needTransfer: boolean;

  /**
   * 可选迁移目标分类列表。
   */
  transferOptions: AssetOptionItem[];
}

/**
 * 删除分类请求。
 */
export interface AssetCategoryDeleteData {
  /**
   * 待删除分类 ID 列表。
   */
  ids: number[];

  /**
   * 迁移目标分类 ID。
   */
  transferCategoryId?: number;
}

/**
 * 获取设备分类列表。
 */
export const getList = () => {
  return request<AssetCategoryItem[]>('/asset/category/list', {
    method: 'get',
  });
};

/**
 * 新建设备分类。
 */
export const create = (data: AssetCategorySaveData) => {
  return request<AssetCategoryItem>('/asset/category/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑设备分类。
 */
export const edit = (id: number, data: AssetCategorySaveData) => {
  return request<AssetCategoryItem>('/asset/category/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除前检查设备分类引用情况。
 */
export const deleteCheck = (data: AssetCategoryDeleteCheckData) => {
  return request<AssetCategoryDeleteCheckResult>('/asset/category/delete-check', {
    method: 'post',
    data,
  });
};

/**
 * 删除设备分类。
 */
export const deleteCategory = (data: AssetCategoryDeleteData) => {
  return request<void>('/asset/category/delete', {
    method: 'post',
    data,
  });
};
