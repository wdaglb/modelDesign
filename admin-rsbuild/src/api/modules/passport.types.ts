export interface CurrentInfoVo {
  /**
   * 头像id
   */
  avatarId: string;
  /**
   * 登录id
   */
  loginId: string;
  /**
   * 登录ip
   */
  loginIp: string;
  /**
   * 姓名
   */
  nickname: string;
  /**
   * 凭证创建时间
   */
  tokenCreateTime: string;
  /**
   * 用户id
   */
  userId: number;
  /**
   * 用户名
   */
  username: string;
  [property: string]: any;
}

export interface PassportCurrentPermission {
  menus: PassportCurrentPermissionMenu[];
}

export interface PassportCurrentPermissionMenu {
  id: number;
  parentId: number;
  /**
   * 菜单标识
   */
  name: string;
  /**
   * 显示名称
   */
  title: string;
  /**
   * 图标类型
   */
  iconType: string;
  /**
   * 图标值
   */
  iconValue: string;
}
