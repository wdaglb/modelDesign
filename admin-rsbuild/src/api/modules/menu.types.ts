/**
 * 系统菜单
 */
export interface Menu {
  id: number;
  /**
   * 图标类型
   */
  iconType: string;
  /**
   * 图标值
   */
  iconValue: string;
  /**
   * 名称
   */
  name: string;
  parentId: number;
  /**
   * 排序
   */
  sort: number;
  /**
   * 标题
   */
  title: string;
  /**
   * 节点类型
   */
  nodeType: MenuNodeType;
  createdAt?: null | string;
  updatedAt?: null | string;
  [property: string]: any;
}

export enum MenuNodeType {
  /**
   * 菜单
   */
  MENU = 0,
  /**
   * 按钮
   */
  BUTTON = 1,
}
export const MenuNodeTypeLabel = {
  [MenuNodeType.MENU]: '菜单',
  [MenuNodeType.BUTTON]: '按钮',
};
export const MenuNodeTypeOptions = [MenuNodeType.MENU, MenuNodeType.BUTTON].map(
  (item) => ({
    label: MenuNodeTypeLabel[item],
    value: item,
  }),
);

/**
 * 按钮类型
 */
export enum ButtonType {
  /**
   * 创建
   */
  Create = 'create',
  /**
   * 修改
   */
  Edit = 'edit',
  /**
   * 删除
   */
  Delete = 'delete',
}
export const ButtonTypeLabel = {
  [ButtonType.Create]: '创建',
  [ButtonType.Edit]: '修改',
  [ButtonType.Delete]: '删除',
};
export const ButtonTypeOptions = [
  ButtonType.Create,
  ButtonType.Edit,
  ButtonType.Delete,
].map((item) => ({
  label: ButtonTypeLabel[item],
  value: item,
}));
