import { useMemo } from 'react';

import useAuthStore from '@/store/auth.ts';
import {
  canAccessPath,
  getFirstAccessiblePath,
  hasButtonPermission,
} from '@/utils/permission.ts';

/**
 * 统一封装前端权限读取逻辑。
 *
 * 页面只关心“能不能看菜单”和“能不能点按钮”，
 * 不需要直接处理 store 内部的原始权限结构。
 */
const usePermission = () => {
  const menus = useAuthStore((state) => state.menus);
  const buttons = useAuthStore((state) => state.buttons);

  return useMemo(() => {
    return {
      canAccessPath: (pathname: string) => canAccessPath(menus, pathname),
      getFirstAccessiblePath: () => getFirstAccessiblePath(menus),
      hasButtonPermission: (permissionCode?: string) =>
        hasButtonPermission(buttons, permissionCode),
    };
  }, [buttons, menus]);
};

export default usePermission;
