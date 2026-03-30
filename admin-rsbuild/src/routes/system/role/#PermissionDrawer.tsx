import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Flex, Input, message, Spin, Tabs, Tree } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DataNode } from 'antd/es/tree';

import { ApiMenu, ApiRole } from '@/api';
import { Role } from '@/api/modules/role';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';

interface Props {
  role: Role;
}

/**
 * 将扁平菜单列表转为 Tree 所需的 DataNode 树，支持高亮搜索关键词。
 */
function buildTreeNodes(menus: any[], keyword: string): DataNode[] {
  const map = new Map<number, DataNode>();
  const roots: DataNode[] = [];

  for (const m of menus) {
    const title =
      keyword && m.title.includes(keyword) ? (
        <span>
          {m.title.split(keyword).map((part: string, i: number) =>
            i === 0 ? (
              part
            ) : (
              <React.Fragment key={i}>
                <span style={{ color: '#1677ff', fontWeight: 600 }}>
                  {keyword}
                </span>
                {part}
              </React.Fragment>
            ),
          )}
        </span>
      ) : (
        m.title
      );
    map.set(m.id, { key: m.name, title, children: [] });
  }
  for (const m of menus) {
    const node = map.get(m.id)!;
    if (m.parentId && map.has(m.parentId)) {
      (map.get(m.parentId)!.children as DataNode[]).push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * 根据勾选的菜单 name 集合，补全所有祖先节点的 name。
 *
 * 例如勾选 /system/role，则 /system 也会被包含进结果，确保父菜单可见。
 */
function collectWithAncestors(checkedNames: string[], menus: any[]): string[] {
  const nameToParentId = new Map<string, number>();
  const idToName = new Map<number, string>();
  for (const m of menus) {
    nameToParentId.set(m.name, m.parentId);
    idToName.set(m.id, m.name);
  }

  const result = new Set(checkedNames);
  for (const name of checkedNames) {
    let parentId = nameToParentId.get(name);
    while (parentId) {
      const parentName = idToName.get(parentId);
      if (!parentName) break;
      result.add(parentName);
      parentId = nameToParentId.get(parentName);
    }
  }
  return Array.from(result);
}

/**
 * 角色菜单权限配置面板。
 *
 * 展示完整菜单树，勾选项即为该角色拥有的菜单权限（obj=菜单 name/path）。
 */
const MenuPermissionPanel = ({ role }: { role: Role }) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();

  const { data: menuList = [], isLoading: menuLoading } = useQuery({
    // 使用独立 key，避免与菜单管理页面的树形缓存（systemPolicy.list）冲突
    queryKey: ['rolePermissionMenuList'],
    queryFn: () => ApiMenu.getList(),
  });

  const { data: permission, isLoading: permLoading } = useQuery({
    queryKey: queryKey.role.permission(role.code),
    queryFn: () => ApiRole.getPermission(role.code),
    // 每次打开都重新拉取最新权限，不使用缓存
    staleTime: 0,
  });

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (permission) {
      setCheckedKeys(permission.menus);
    }
  }, [permission]);

  const menus = menuList as any[];

  // 所有菜单 name 列表，用于全选
  const allKeys = useMemo(() => menus.map((m) => m.name), [menuList]);

  // 根节点 key 列表，用于默认展开
  const rootKeys = useMemo(
    () =>
      menus
        .filter((m) => !m.parentId || !menus.find((p) => p.id === m.parentId))
        .map((m) => m.name),
    [menuList],
  );

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 菜单加载完成后初始化展开根节点
  useEffect(() => {
    if (rootKeys.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(rootKeys);
    }
  }, [rootKeys.join(',')]);

  // 搜索时：过滤匹配节点并展开其所有祖先
  useEffect(() => {
    if (!searchValue) {
      setExpandedKeys(rootKeys);
      return;
    }
    const idToName = new Map<number, string>();
    const nameToParentId = new Map<string, number>();
    for (const m of menus) {
      idToName.set(m.id, m.name);
      nameToParentId.set(m.name, m.parentId);
    }
    const matchedNames = menus
      .filter((m) => m.title.includes(searchValue))
      .map((m) => m.name);
    const toExpand = new Set<string>();
    for (const name of matchedNames) {
      let parentId = nameToParentId.get(name);
      while (parentId) {
        const parentName = idToName.get(parentId);
        if (!parentName) break;
        toExpand.add(parentName);
        parentId = nameToParentId.get(parentName);
      }
    }
    setExpandedKeys(Array.from(toExpand));
  }, [searchValue]);

  // 搜索时只展示包含关键词或其后代包含关键词的节点
  const filteredMenus = useMemo(() => {
    if (!searchValue) return menus;
    const idToName = new Map<number, string>();
    for (const m of menus) idToName.set(m.id, m.name);

    // 收集所有子孙
    const collectDescendants = (name: string): string[] => {
      const children = menus.filter((m) => idToName.get(m.parentId) === name);
      return children.flatMap((c) => [c.name, ...collectDescendants(c.name)]);
    };

    const keepNames = new Set<string>();
    for (const m of menus) {
      if (!m.title.includes(searchValue)) continue;
      keepNames.add(m.name);
      // 保留祖先
      collectWithAncestors([m.name], menus).forEach((n) => keepNames.add(n));
      // 保留后代
      collectDescendants(m.name).forEach((n) => keepNames.add(n));
    }
    return menus.filter((m) => keepNames.has(m.name));
  }, [searchValue, menuList]);

  const treeData = useMemo(
    () => buildTreeNodes(filteredMenus, searchValue),
    [filteredMenus, searchValue],
  );

  /** 全选所有菜单 */
  const handleSelectAll = () => setCheckedKeys(allKeys);

  /** 取消全选 */
  const handleDeselectAll = () => setCheckedKeys([]);

  /**
   * 勾选/取消时同步处理父子节点：
   * - 勾选子节点时，自动勾选其所有祖先节点
   * - 勾选父节点时，自动勾选其所有子孙节点
   * - 取消父节点时，自动取消其所有子孙节点
   * - 取消子节点时，若父节点下已无勾选子节点则自动取消父节点
   */
  const handleCheck = (keys: any) => {
    const nextChecked = new Set<string>(
      Array.isArray(keys) ? keys : (keys.checked as string[]),
    );
    const prevChecked = new Set<string>(checkedKeys);

    const nameToMenu = new Map<string, any>();
    const idToName = new Map<number, string>();
    for (const m of menus) {
      nameToMenu.set(m.name, m);
      idToName.set(m.id, m.name);
    }

    const collectDescendants = (name: string): string[] => {
      const children = menus.filter((m) => idToName.get(m.parentId) === name);
      return children.flatMap((c) => [c.name, ...collectDescendants(c.name)]);
    };

    const collectAncestors = (name: string): string[] => {
      const menu = nameToMenu.get(name);
      if (!menu || !menu.parentId) return [];
      const parentName = idToName.get(menu.parentId);
      if (!parentName) return [];
      return [parentName, ...collectAncestors(parentName)];
    };

    const added = [...nextChecked].filter((k) => !prevChecked.has(k));
    const removed = [...prevChecked].filter((k) => !nextChecked.has(k));

    // 勾选：向下补全子孙，向上补全祖先
    for (const key of added) {
      collectDescendants(key).forEach((k) => nextChecked.add(k));
      collectAncestors(key).forEach((k) => nextChecked.add(k));
    }

    // 取消：向下取消子孙
    for (const key of removed) {
      collectDescendants(key).forEach((k) => nextChecked.delete(k));
    }

    // 取消后，若某祖先节点下已无任何子孙被勾选，则也取消该祖先
    for (const key of removed) {
      for (const ancestor of collectAncestors(key)) {
        const hasCheckedChild = collectDescendants(ancestor).some((k) =>
          nextChecked.has(k),
        );
        if (!hasCheckedChild) {
          nextChecked.delete(ancestor);
        }
      }
    }

    setCheckedKeys(Array.from(nextChecked));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const menusWithAncestors = collectWithAncestors(checkedKeys, menus);
      await ApiRole.updatePermission(role.code, { menus: menusWithAncestors });
      await queryClient.invalidateQueries({
        queryKey: queryKey.role.permission(role.code),
      });
      message.success('权限保存成功');
      ctx.resolve();
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = menuLoading || permLoading;

  // 统一边框颜色，与 Ant Design 默认 border 保持一致
  const borderColor = 'rgba(0,0,0,0.15)';

  return (
    <Flex vertical gap={0} style={{ minHeight: 200 }}>
      {/* 外层卡片容器，统一边框 */}
      <div
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* 搜索 + 全选操作栏 */}
        <Flex
          align={'center'}
          gap={8}
          style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${borderColor}`,
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <Input
            placeholder={'搜索菜单'}
            allowClear
            size={'small'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button size={'small'} onClick={handleSelectAll} disabled={isLoading}>
            全选
          </Button>
          <Button
            size={'small'}
            onClick={handleDeselectAll}
            disabled={isLoading}
          >
            取消全选
          </Button>
        </Flex>

        {/* 树主体 */}
        <div
          style={{
            padding: '8px 4px',
            minHeight: 240,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          <Spin spinning={isLoading}>
            {treeData.length > 0 ? (
              <Tree
                checkable
                checkStrictly
                blockNode
                treeData={treeData}
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys as string[])}
                onCheck={handleCheck}
                onSelect={(_, { node }) => {
                  // 点击整行时触发勾选/取消，而不是节点选中
                  const key = node.key as string;
                  const next = checkedKeys.includes(key)
                    ? checkedKeys.filter((k) => k !== key)
                    : [...checkedKeys, key];
                  handleCheck(next);
                }}
                style={{ fontSize: 14 }}
              />
            ) : (
              <Empty
                description={searchValue ? '未找到匹配菜单' : '暂无菜单数据'}
                style={{ marginTop: 40 }}
              />
            )}
          </Spin>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <Flex gap={8} justify={'flex-end'} style={{ marginTop: 16 }}>
        <Button onClick={() => ctx.close()}>取消</Button>
        <Button type={'primary'} loading={submitting} onClick={handleSave}>
          保存
        </Button>
      </Flex>
    </Flex>
  );
};

/**
 * 权限配置内容，包含「菜单权限」和「接口权限」两个 Tab。
 */
const PermissionDrawer = ({ role }: Props) => {
  return (
    <Tabs
      items={[
        {
          key: 'menu',
          label: '菜单权限',
          children: <MenuPermissionPanel role={role} />,
        },
        {
          key: 'api',
          label: '接口权限',
          children: <Empty description={'接口权限配置待实现'} />,
        },
      ]}
    />
  );
};

export default PermissionDrawer;
