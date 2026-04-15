import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Menu } from '@/api/modules/menu.types.ts';

import {
  addNodeAndDescendants,
  buildPermissionResourceValue,
  buildTreeNodes,
  collectDirectCheckedKeys,
  collectRootKeys,
  removeNodeAndDescendants,
  resolveTreeCheckAction,
  splitPermissionResources,
} from '../permissionResourcePanel.helper.tsx';

function findNodeTitleByKey(nodes: Array<{ key?: string; title?: React.ReactNode; children?: unknown }>, key: string) {
  for (const node of nodes) {
    if (node.key === key) {
      return node.title;
    }
    if (Array.isArray(node.children)) {
      const childTitle = findNodeTitleByKey(
        node.children as Array<{ key?: string; title?: React.ReactNode; children?: unknown }>,
        key,
      );
      if (childTitle) {
        return childTitle;
      }
    }
  }
  return undefined;
}

function renderTitleText(title: React.ReactNode) {
  const view = render(<>{title}</>);
  return view.container.textContent;
}

function cleanupTitle(viewTitle: string | null) {
  return viewTitle?.replace(/\s+/g, '') ?? '';
}

const menus: Menu[] = [
  {
    id: 1,
    parentId: 0,
    name: '/system',
    title: '系统管理',
    iconType: 'mdi',
    iconValue: 'mdi:cog',
    sort: 1,
    nodeType: 0,
  },
  {
    id: 2,
    parentId: 1,
    name: '/system/role',
    title: '角色管理',
    iconType: 'mdi',
    iconValue: 'mdi:shield-account',
    sort: 2,
    nodeType: 0,
  },
  {
    id: 3,
    parentId: 2,
    name: '/system/role/permission',
    title: '权限配置',
    iconType: 'mdi',
    iconValue: 'mdi:key',
    sort: 3,
    nodeType: 1,
  },
  {
    id: 4,
    parentId: 2,
    name: '/system/role/edit',
    title: '编辑角色',
    iconType: 'mdi',
    iconValue: 'mdi:pencil',
    sort: 4,
    nodeType: 1,
  },
];

describe('permissionResourcePanel helper', () => {
  it('should keep menu resources in checked keys and wildcard resources in text area', () => {
    const selectableResourceNameSet = new Set([
      ...menus.map((item) => item.name),
      '/permission-group/delete',
    ]);
    const result = splitPermissionResources(
      [
        '/system',
        '/project/**',
        '/system/role/permission',
        '/permission-group/delete',
      ],
      menus,
      selectableResourceNameSet,
    );

    expect(result.directCheckedKeys).toEqual([
      '/system/role/permission',
      '/permission-group/delete',
    ]);
    expect(result.extraText).toBe('/project/**');
  });

  it('should only append ancestors when building submit resources', () => {
    const result = buildPermissionResourceValue(
      ['/system/role/permission'],
      menus,
      '/project/**',
    );

    expect(result).toEqual([
      '/system/role/permission',
      '/system/role',
      '/system',
      '/project/**',
    ]);
    expect(result).not.toContain('/system/role/edit');
  });

  it('should add descendants when parent node is checked', () => {
    expect(addNodeAndDescendants([], '/system/role', menus)).toEqual([
      '/system/role',
      '/system/role/permission',
      '/system/role/edit',
    ]);
  });

  it('should remove descendants when parent node is unchecked', () => {
    expect(
      removeNodeAndDescendants(
        ['/system/role/permission', '/system/role/edit'],
        '/system/role',
        menus,
      ),
    ).toEqual([]);
  });

  it('should resolve tree check action from antd event payload', () => {
    expect(
      resolveTreeCheckAction({
        checked: false,
        node: {
          key: '/system/role',
        },
      }),
    ).toEqual({
      checked: false,
      key: '/system/role',
    });
  });

  it('should collect root keys for initial expand state', () => {
    expect(collectRootKeys(menus)).toEqual(['/system']);
  });

  it('should remove ancestor nodes from direct checked keys on reload', () => {
    expect(
      collectDirectCheckedKeys(
        ['/system', '/system/role', '/system/role/permission'],
        menus,
      ),
    ).toEqual(['/system/role/permission']);
  });

  it('should render api usage badge in tree title', () => {
    const treeNodes = buildTreeNodes(menus, '', {
      '/system/role/permission': 5,
    });
    const title = findNodeTitleByKey(treeNodes, '/system/role/permission');

    expect(cleanupTitle(renderTitleText(title))).toContain('权限配置5');
  });
});
