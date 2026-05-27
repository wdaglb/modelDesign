import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PassportCurrentPermissionMenu } from '@/api/modules/passport.types.ts';

import {
  buildSideMenuData,
  resolveSideSelectedKey,
} from '../#sideMenuHelper.tsx';

const menus: PassportCurrentPermissionMenu[] = [
  {
    id: 1,
    parentId: 0,
    name: '/project',
    title: '项目管理',
    iconType: 'mdi',
    iconValue: 'mdi:folder',
  },
  {
    id: 2,
    parentId: 1,
    name: '/project/task-type',
    title: '任务类型',
    iconType: 'mdi',
    iconValue: 'mdi:shape',
  },
];

describe('buildSideMenuData', () => {
  it('父级菜单存在子菜单时标题仍可点击进入自身路由', async () => {
    const user = userEvent.setup();
    const onParentNavigate = vi.fn();
    const { menuData, parentKeys } = buildSideMenuData(menus, onParentNavigate);

    expect(parentKeys['/project/task-type']).toEqual(['/project']);

    const projectMenu = menuData[0];
    expect(projectMenu).toBeTruthy();
    render(<>{projectMenu?.label}</>);

    await user.click(screen.getByText('项目管理'));

    expect(onParentNavigate).toHaveBeenCalledWith('/project');
  });

  it('项目管理子菜单使用独立路由 key', () => {
    const { menuData } = buildSideMenuData(
      [
        ...menus,
        {
          id: 3,
          parentId: 1,
          name: '/project/list',
          title: '项目管理',
          iconType: 'none',
          iconValue: '',
        },
      ],
      vi.fn(),
    );

    const projectMenu = menuData[0];
    expect(projectMenu).toBeTruthy();

    const children = projectMenu?.children as Array<{ key: string }>;
    expect(children[1]).toEqual(
      expect.objectContaining({
        key: '/project/list',
      }),
    );
  });

  it('项目详情路径应高亮项目管理子菜单', () => {
    const { parentKeys } = buildSideMenuData(
      [
        ...menus,
        {
          id: 3,
          parentId: 1,
          name: '/project/list',
          title: '项目管理',
          iconType: 'none',
          iconValue: '',
        },
        {
          id: 4,
          parentId: 1,
          name: '/project/task-status',
          title: '任务状态',
          iconType: 'none',
          iconValue: '',
        },
      ],
      vi.fn(),
    );

    expect(resolveSideSelectedKey('/project/123', parentKeys)).toBe(
      '/project/list',
    );
    expect(resolveSideSelectedKey('/project/123/tasks', parentKeys)).toBe(
      '/project/list',
    );
    expect(resolveSideSelectedKey('/project/task-status', parentKeys)).toBe(
      '/project/task-status',
    );
  });
});
