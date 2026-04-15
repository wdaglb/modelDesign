import React from 'react';
import { Badge, Flex } from 'antd';
import type { DataNode } from 'antd/es/tree';

import type { Menu } from '@/api/modules/menu.types.ts';

/**
 * 拆分权限资源值。
 *
 * 这里保留后端返回的菜单资源原样作为树的选中值，
 * 目的是在严格勾选模式下避免组件误把祖先节点推导成整棵子树选中。
 */
export function splitPermissionResources(
  value: string[],
  menus: Menu[],
  selectableResourceNameSet: Set<string>,
) {
  const checkedKeys: string[] = [];
  const extraResources: string[] = [];

  for (const resource of value) {
    if (selectableResourceNameSet.has(resource)) {
      checkedKeys.push(resource);
      continue;
    }
    extraResources.push(resource);
  }

  return {
    directCheckedKeys: collectDirectCheckedKeys(checkedKeys, menus),
    extraText: extraResources.join('\n'),
  };
}

/**
 * 构造最终要提交的权限资源。
 *
 * 角色和资源组接口都依赖祖先菜单资源来维持路径可达性，
 * 因此保存时仍需显式补齐祖先节点，但不能把后代节点一起带上。
 */
export function buildPermissionResourceValue(
  checkedKeys: string[],
  menus: Menu[],
  extraText: string,
) {
  const resourcesWithAncestors = collectWithAncestors(checkedKeys, menus);
  const extraResources = parseExtraResources(extraText);
  return Array.from(
    new Set([...resourcesWithAncestors, ...extraResources]),
  );
}

/**
 * 兼容 antd Tree 在严格勾选模式下的返回结构。
 */
export function resolveStrictCheckedKeys(keys: unknown) {
  if (Array.isArray(keys)) {
    return keys.map((item) => String(item));
  }

  const checked = (keys as { checked?: React.Key[] }).checked;
  if (!checked) {
    return [];
  }

  return checked.map((item) => String(item));
}

/**
 * 解析树勾选事件。
 *
 * antd 的事件节点在不同内部实现下可能挂载在 `key` 或 `props.eventKey`，
 * 这里统一兜底解析，避免交互逻辑绑定到单一实现细节。
 */
export function resolveTreeCheckAction(info: unknown) {
  let checked: boolean | undefined;
  let key: string | undefined;

  if (info && typeof info === 'object') {
    const eventInfo = info as {
      checked?: boolean;
      node?: { key?: React.Key; props?: { eventKey?: React.Key } };
    };
    checked = eventInfo.checked;

    if (eventInfo.node?.key !== undefined) {
      key = String(eventInfo.node.key);
    }

    if (key === undefined && eventInfo.node?.props?.eventKey !== undefined) {
      key = String(eventInfo.node.props.eventKey);
    }
  }

  return {
    checked,
    key,
  };
}

/**
 * 从当前选中集合中移除指定节点及其全部后代。
 *
 * 取消父级勾选时，用户的真实意图是清空整棵子树，
 * 否则会留下无法从界面直观看懂的“子节点仍选中”状态。
 */
export function removeNodeAndDescendants(
  checkedKeys: string[],
  targetKey: string,
  menus: Menu[],
) {
  const idToName = new Map<number, string>();
  for (const menu of menus) {
    idToName.set(menu.id, menu.name);
  }

  const removedKeys = new Set<string>([targetKey]);
  collectDescendants(targetKey, menus, idToName).forEach((item) => {
    removedKeys.add(item);
  });

  return checkedKeys.filter((item) => !removedKeys.has(item));
}

/**
 * 将指定节点及其全部后代加入选中集合。
 *
 * 选择父级时需要同步选中整棵子树，
 * 这样角色配置的可见状态才与用户心智一致。
 */
export function addNodeAndDescendants(
  checkedKeys: string[],
  targetKey: string,
  menus: Menu[],
) {
  const idToName = new Map<number, string>();
  for (const menu of menus) {
    idToName.set(menu.id, menu.name);
  }

  const nextCheckedKeys = new Set<string>(checkedKeys);
  nextCheckedKeys.add(targetKey);
  collectDescendants(targetKey, menus, idToName).forEach((item) => {
    nextCheckedKeys.add(item);
  });

  return Array.from(nextCheckedKeys);
}

/**
 * 计算树的根节点 key。
 */
export function collectRootKeys(menus: Menu[]) {
  return menus
    .filter((item) => {
      if (!item.parentId) {
        return true;
      }
      return !menus.find((parent) => parent.id === item.parentId);
    })
    .map((item) => item.name);
}

/**
 * 将扁平菜单列表转成 Tree 节点。
 */
export function buildTreeNodes(
  menus: Menu[],
  keyword: string,
  menuApiUsageCountMap?: Record<string, number>,
): DataNode[] {
  const nodeMap = new Map<number, DataNode>();
  const rootNodes: DataNode[] = [];

  for (const menu of menus) {
    let titleContent: React.ReactNode = menu.title;
    if (keyword && menu.title.includes(keyword)) {
      titleContent = (
        <span>
          {menu.title.split(keyword).map((part, index) => {
            if (index === 0) {
              return part;
            }

            return (
              <React.Fragment key={`${menu.id}-${index}`}>
                <span style={{ color: '#1677ff', fontWeight: 600 }}>
                  {keyword}
                </span>
                {part}
              </React.Fragment>
            );
          })}
        </span>
      );
    }

    const apiUsageCount = menuApiUsageCountMap?.[menu.name] ?? 0;
    const title = (
      <Flex align={'center'} gap={8} wrap={false}>
        <span>{titleContent}</span>
        <Badge
          count={apiUsageCount}
          color={'#1677ff'}
          showZero
          style={{ boxShadow: 'none' }}
        />
      </Flex>
    );

    nodeMap.set(menu.id, {
      key: menu.name,
      title,
      children: [],
    });
  }

  for (const menu of menus) {
    const node = nodeMap.get(menu.id);
    if (!node) {
      continue;
    }

    if (menu.parentId && nodeMap.has(menu.parentId)) {
      const parentNode = nodeMap.get(menu.parentId);
      if (parentNode) {
        (parentNode.children as DataNode[]).push(node);
      }
      continue;
    }

    rootNodes.push(node);
  }

  return rootNodes;
}

/**
 * 收集节点祖先。
 */
export function collectWithAncestors(checkedNames: string[], menus: Menu[]) {
  const nameToParentId = new Map<string, number>();
  const idToName = new Map<number, string>();

  for (const menu of menus) {
    nameToParentId.set(menu.name, menu.parentId);
    idToName.set(menu.id, menu.name);
  }

  const result = new Set(checkedNames);
  for (const name of checkedNames) {
    let parentId = nameToParentId.get(name);
    while (parentId) {
      const parentName = idToName.get(parentId);
      if (!parentName) {
        break;
      }
      result.add(parentName);
      parentId = nameToParentId.get(parentName);
    }
  }

  return Array.from(result);
}

/**
 * 提取直接选择的节点集合。
 *
 * 后端会持久化祖先资源，因此回填时需要先剥离这些“被动补齐”的祖先，
 * 这样取消父级勾选时才能准确清空整棵子树，而不会残留祖先选中状态。
 */
export function collectDirectCheckedKeys(
  checkedNames: string[],
  menus: Menu[],
) {
  const idToName = new Map<number, string>();
  for (const menu of menus) {
    idToName.set(menu.id, menu.name);
  }

  const checkedSet = new Set(checkedNames);
  return checkedNames.filter((name) => {
    const descendants = collectDescendants(name, menus, idToName);
    return !descendants.some((item) => checkedSet.has(item));
  });
}

/**
 * 收集节点后代。
 */
export function collectDescendants(
  name: string,
  menus: Menu[],
  idToName: Map<number, string>,
): string[] {
  const children = menus.filter((item) => idToName.get(item.parentId) === name);
  return children.flatMap((item) => {
    return [item.name, ...collectDescendants(item.name, menus, idToName)];
  });
}

/**
 * 解析通配资源文本输入。
 */
export function parseExtraResources(extraText: string) {
  const resources = extraText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(resources));
}
