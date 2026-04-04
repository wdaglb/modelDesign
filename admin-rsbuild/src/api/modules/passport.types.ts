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
   * 当前租户id
   */
  tenantId: number;
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

/**
 * 更新当前登录用户基础资料参数。
 */
export interface UpdateCurrentProfileParams {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 头像文件 ID。
   */
  avatarId?: string;
}

/**
 * 登录历史记录。
 */
export interface LoginHistoryVo {
  /**
   * 登录流水号。
   */
  loginId: string;

  /**
   * 登录 IP。
   */
  loginIp: string;

  /**
   * 登录方式。
   */
  loginType: string;

  /**
   * 登录时间。
   */
  loginTime: string;

  /**
   * 浏览器名称。
   */
  browserName: string;

  /**
   * 浏览器版本。
   */
  browserVersion: string;

  /**
   * 操作系统名称。
   */
  osName: string;

  /**
   * 操作系统版本。
   */
  osVersion: string;

  /**
   * 设备类型。
   */
  deviceType: string;
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
