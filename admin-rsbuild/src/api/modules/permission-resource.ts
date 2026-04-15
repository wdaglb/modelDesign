import request from '@/utils/request.ts';

/**
 * 接口资源目录项。
 */
export interface PermissionResourceCatalogItem {
  /**
   * 资源路径。
   */
  resource: string;

  /**
   * 资源标题。
   */
  title: string;

  /**
   * 对应的 HTTP 方法集合。
   */
  methods: string[];
}

/**
 * 获取接口资源目录。
 */
export const getCatalog = () => {
  return request<PermissionResourceCatalogItem[]>('/permission-resource/catalog');
};
