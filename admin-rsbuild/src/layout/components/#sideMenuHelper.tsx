import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import type { ItemType } from 'antd/es/menu/interface';

import type { PassportCurrentPermissionMenu } from '@/api/modules/passport.types.ts';

export type SideMenuItem = {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: SideMenuItem[];
};

export type SideMenuParentKeys = Record<string, string[]>;

interface SideMenuBuildResult {
  menuData: ItemType[];
  parentKeys: SideMenuParentKeys;
}

/**
 * 构造侧边栏菜单树。
 *
 * Ant Design Menu 在节点存在 children 时会把该节点渲染为 SubMenu，
 * 默认只负责展开收起，不会触发 Menu.onClick。项目管理这类父节点本身
 * 也有真实路由，因此需要给父级标题补充独立点击入口。
 *
 * @param menus 当前用户可见的权限菜单
 * @param onParentNavigate 父级菜单标题点击后的导航回调
 * @return 侧边栏菜单数据和每个菜单的父级 key 路径
 */
export function buildSideMenuData(
  menus: PassportCurrentPermissionMenu[],
  onParentNavigate: (key: string) => void,
): SideMenuBuildResult {
  const result: SideMenuItem[] = [];
  const keyData: Record<number, SideMenuItem> = {};
  const menuParentIds: Record<number, number | undefined> = {};
  const keys: SideMenuParentKeys = {};

  for (const item of menus) {
    const menuKey = normalizeMenuKey(item.name);
    let icon: ReactNode = null;
    if (item.iconValue) {
      icon = <Icon icon={item.iconValue} />;
    }

    keyData[item.id] = {
      key: menuKey,
      label: item.title,
      icon,
      children: [],
    };
    menuParentIds[item.id] = item.parentId || undefined;
  }

  const getParentKeys = (id: number) => {
    const parentPath: string[] = [];
    let currentParentId = menuParentIds[id];

    while (currentParentId) {
      const parent = keyData[currentParentId];
      if (!parent) {
        break;
      }
      parentPath.unshift(parent.key);
      currentParentId = menuParentIds[currentParentId];
    }

    return parentPath;
  };

  for (const item of menus) {
    const current = keyData[item.id];
    keys[current.key] = getParentKeys(item.id);

    if (!item.parentId) {
      result.push(current);
      continue;
    }

    const parent = keyData[item.parentId];
    if (!parent) {
      continue;
    }

    parent.children ??= [];
    parent.children.push(current);
  }

  pruneEmptyChildren(result);
  attachParentNavigation(result, onParentNavigate);

  return {
    menuData: result as ItemType[],
    parentKeys: keys,
  };
}

/**
 * 根据当前路由解析侧边栏选中菜单。
 *
 * `/project` 已经作为“项目”分组存在，项目列表入口改为 `/project/list`。
 * 进入项目详情页 `/project/:projectId` 及其项目内页时，视觉上仍应高亮
 * “项目管理”子菜单；但任务类型、任务状态这类独立子菜单需要保持自身高亮。
 *
 * @param pathname 当前浏览器路径
 * @param parentKeys 菜单父级 key 映射
 * @return 应选中的菜单 key
 */
export function resolveSideSelectedKey(
  pathname: string,
  parentKeys: SideMenuParentKeys,
) {
  const matchedSelectedKey = Object.keys(parentKeys)
    .filter((key) => {
      return pathname === key || pathname.startsWith(`${key}/`);
    })
    .sort((leftKey, rightKey) => rightKey.length - leftKey.length)[0];

  if (shouldSelectProjectList(pathname, parentKeys, matchedSelectedKey)) {
    return '/project/list';
  }

  return matchedSelectedKey || pathname;
}

/**
 * 规范化菜单 key，兼容后端返回不带斜杠的菜单标识。
 *
 * @param name 菜单资源名
 * @return 可用于路由跳转的菜单 key
 */
function normalizeMenuKey(name: string) {
  if (name.startsWith('/')) {
    return name;
  }

  return `/${name}`;
}

/**
 * 判断当前路径是否应归属“项目管理”子菜单。
 *
 * 只把项目列表和数字项目详情路由归到 `/project/list`，避免
 * `/project/task-type`、`/project/task-status` 被错误高亮到项目列表。
 *
 * @param pathname 当前浏览器路径
 * @param parentKeys 菜单父级 key 映射
 * @param matchedSelectedKey 已按最长前缀匹配出的菜单 key
 * @return 是否应高亮项目管理子菜单
 */
function shouldSelectProjectList(
  pathname: string,
  parentKeys: SideMenuParentKeys,
  matchedSelectedKey?: string,
) {
  if (!parentKeys['/project/list']) {
    return false;
  }

  if (pathname === '/project') {
    return true;
  }

  if (matchedSelectedKey && matchedSelectedKey !== '/project') {
    return false;
  }

  return /^\/project\/\d+(\/|$)/.test(pathname);
}

/**
 * 清理没有子节点的 children 字段，避免 Ant Design 把叶子节点误判为父级。
 *
 * @param items 菜单树节点
 */
function pruneEmptyChildren(items: SideMenuItem[]) {
  for (const item of items) {
    if (item.children?.length) {
      pruneEmptyChildren(item.children);
    }

    if (!item.children?.length) {
      delete item.children;
    }
  }
}

/**
 * 为有子菜单且自身可访问的父级标题补充点击导航。
 *
 * @param items 菜单树节点
 * @param onParentNavigate 父级菜单标题点击后的导航回调
 */
function attachParentNavigation(
  items: SideMenuItem[],
  onParentNavigate: (key: string) => void,
) {
  for (const item of items) {
    if (item.children?.length) {
      const menuKey = item.key;
      item.label = (
        <span
          onClick={(event) => {
            event.stopPropagation();
            onParentNavigate(menuKey);
          }}
        >
          {item.label}
        </span>
      );
      attachParentNavigation(item.children, onParentNavigate);
    }
  }
}
