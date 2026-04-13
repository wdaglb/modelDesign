import React, { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Flex, Input, Spin, Tree } from 'antd';

import type { Menu } from '@/api/modules/menu.types.ts';
import { filterAssignableMenuNodes } from '@/utils/permission.ts';
import {
  addNodeAndDescendants,
  buildPermissionResourceValue,
  buildTreeNodes,
  collectDirectCheckedKeys,
  collectDescendants,
  collectWithAncestors,
  collectRootKeys,
  removeNodeAndDescendants,
  resolveStrictCheckedKeys,
  resolveTreeCheckAction,
  splitPermissionResources,
} from './permissionResourcePanel.helper.tsx';

interface PermissionResourcePanelProps {
  /**
   * 全量菜单资源。
   */
  menuList: Menu[];

  /**
   * 当前选中的资源列表。
   */
  value: string[];

  /**
   * 当前租户 ID。
   */
  tenantId?: number;

  /**
   * 当前用户 ID。
   */
  userId?: number;

  /**
   * 是否加载中。
   */
  loading?: boolean;

  /**
   * 资源变更回调。
   */
  onChange: (resources: string[]) => void;
}

/**
 * 通用权限资源编辑面板。
 *
 * 该面板统一承载两类资源输入：
 * 1. 菜单树勾选出的具体资源
 * 2. 手工录入的通配资源
 */
const PermissionResourcePanel = (props: PermissionResourcePanelProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [directCheckedKeys, setDirectCheckedKeys] = useState<string[]>([]);
  const [extraText, setExtraText] = useState('');

  const menus = useMemo(() => {
    return filterAssignableMenuNodes(
      props.menuList,
      props.tenantId,
      props.userId,
    );
  }, [props.menuList, props.tenantId, props.userId]);

  const menuNameSet = useMemo(() => {
    return new Set(menus.map((item) => item.name));
  }, [menus]);

  useEffect(() => {
    const nextResources = splitPermissionResources(
      props.value,
      menus,
      menuNameSet,
    );
    setDirectCheckedKeys(nextResources.directCheckedKeys);
    setExtraText(nextResources.extraText);
  }, [menuNameSet, menus, props.value]);

  const allKeys = useMemo(() => {
    return menus.map((item) => item.name);
  }, [menus]);

  const checkedKeys = useMemo(() => {
    return collectWithAncestors(directCheckedKeys, menus);
  }, [directCheckedKeys, menus]);

  const rootKeys = useMemo(() => {
    return collectRootKeys(menus);
  }, [menus]);

  useEffect(() => {
    if (rootKeys.length === 0) {
      return;
    }
    if (expandedKeys.length !== 0) {
      return;
    }
    setExpandedKeys(rootKeys);
  }, [expandedKeys.length, rootKeys]);

  useEffect(() => {
    if (!searchValue) {
      setExpandedKeys(rootKeys);
      return;
    }

    const idToName = new Map<number, string>();
    const nameToParentId = new Map<string, number>();
    for (const menu of menus) {
      idToName.set(menu.id, menu.name);
      nameToParentId.set(menu.name, menu.parentId);
    }

    const matchedNames = menus
      .filter((item) => item.title.includes(searchValue))
      .map((item) => item.name);
    const nextExpandedKeys = new Set<string>();
    for (const name of matchedNames) {
      let parentId = nameToParentId.get(name);
      while (parentId) {
        const parentName = idToName.get(parentId);
        if (!parentName) {
          break;
        }
        nextExpandedKeys.add(parentName);
        parentId = nameToParentId.get(parentName);
      }
    }
    setExpandedKeys(Array.from(nextExpandedKeys));
  }, [menus, rootKeys, searchValue]);

  const filteredMenus = useMemo(() => {
    if (!searchValue) {
      return menus;
    }

    const idToName = new Map<number, string>();
    for (const menu of menus) {
      idToName.set(menu.id, menu.name);
    }

    const keepNames = new Set<string>();
    for (const menu of menus) {
      if (!menu.title.includes(searchValue)) {
        continue;
      }
      keepNames.add(menu.name);
      collectWithAncestors([menu.name], menus).forEach((name) =>
        keepNames.add(name),
      );
      collectDescendants(menu.name, menus, idToName).forEach((name) =>
        keepNames.add(name),
      );
    }
    return menus.filter((menu) => keepNames.has(menu.name));
  }, [menus, searchValue]);

  const treeData = useMemo(() => {
    return buildTreeNodes(filteredMenus, searchValue);
  }, [filteredMenus, searchValue]);

  const emitResourceChange = (
    nextDirectCheckedKeys: string[],
    nextExtraText: string,
  ) => {
    props.onChange(
      buildPermissionResourceValue(nextDirectCheckedKeys, menus, nextExtraText),
    );
  };

  const handleCheck = (keys: unknown, info: unknown) => {
    const action = resolveTreeCheckAction(info);
    let nextDirectCheckedKeys = directCheckedKeys;

    if (action.key) {
      if (action.checked) {
        nextDirectCheckedKeys = addNodeAndDescendants(
          directCheckedKeys,
          action.key,
          menus,
        );
      }

      if (action.checked === false) {
        nextDirectCheckedKeys = removeNodeAndDescendants(
          directCheckedKeys,
          action.key,
          menus,
        );
      }
    }

    if (!action.key) {
      nextDirectCheckedKeys = collectDirectCheckedKeys(
        resolveStrictCheckedKeys(keys),
        menus,
      );
    }

    setDirectCheckedKeys(nextDirectCheckedKeys);
    emitResourceChange(nextDirectCheckedKeys, extraText);
  };

  return (
    <Flex vertical gap={16}>
      <div
        style={{
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Flex
          align={'center'}
          gap={8}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(0,0,0,0.15)',
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <Input
            placeholder={'搜索资源'}
            allowClear
            size={'small'}
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
            }}
            style={{ flex: 1 }}
          />
          <Button
            size={'small'}
            disabled={props.loading}
            onClick={() => {
              setDirectCheckedKeys(allKeys);
              emitResourceChange(allKeys, extraText);
            }}
          >
            全选
          </Button>
          <Button
            size={'small'}
            disabled={props.loading}
            onClick={() => {
              setDirectCheckedKeys([]);
              emitResourceChange([], extraText);
            }}
          >
            清空树选择
          </Button>
        </Flex>

        <div
          style={{
            padding: '8px 4px',
            minHeight: 240,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          <Spin spinning={Boolean(props.loading)}>
            {treeData.length > 0 ? (
              <Tree
                checkable
                checkStrictly
                blockNode
                treeData={treeData}
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                onExpand={(keys) => {
                  setExpandedKeys(keys as string[]);
                }}
                onCheck={handleCheck}
              />
            ) : (
              <Empty
                description={searchValue ? '未找到匹配资源' : '暂无资源数据'}
                style={{ marginTop: 40 }}
              />
            )}
          </Spin>
        </div>
      </div>

      <Input.TextArea
        rows={6}
        value={extraText}
        placeholder={'每行一个通配资源，例如：/project/**'}
        onChange={(event) => {
          const nextValue = event.target.value;
          setExtraText(nextValue);
          emitResourceChange(directCheckedKeys, nextValue);
        }}
      />
    </Flex>
  );
};

export default PermissionResourcePanel;
