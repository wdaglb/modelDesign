import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Empty,
  Flex,
  Input,
  Space,
  Spin,
  Tag,
  Tabs,
  Tree,
  Typography,
} from 'antd';

import type { Menu } from '@/api/modules/menu.types.ts';
import type { PermissionResourceCatalogItem } from '@/api/modules/permission-resource';
import { filterAssignableMenuNodes } from '@/utils/permission.ts';
import {
  addNodeAndDescendants,
  buildPermissionResourceValue,
  buildTreeNodes,
  collectDirectCheckedKeys,
  collectDescendants,
  collectWithAncestors,
  collectRootKeys,
  parseExtraResources,
  removeNodeAndDescendants,
  resolveStrictCheckedKeys,
  resolveTreeCheckAction,
  splitPermissionResources,
} from './permissionResourcePanel.helper.tsx';

export interface PermissionResourcePanelValue {
  /**
   * 菜单资源集合。
   */
  menuResources: string[];

  /**
   * 接口资源集合。
   */
  apiResources: string[];
}

interface PermissionResourcePanelProps {
  /**
   * 面板展示模式。
   */
  mode?: 'full' | 'menuOnly';

  /**
   * 菜单或按钮对应的接口资源数量映射。
   */
  menuApiUsageCountMap?: Record<string, number>;

  /**
   * 全量菜单资源。
   */
  menuList: Menu[];

  /**
   * 直接勾选菜单资源变更回调。
   */
  onDirectMenuChange?: (resources: string[]) => void;

  /**
   * 后端扫描出的接口资源目录。
   */
  apiResources?: PermissionResourceCatalogItem[];

  /**
   * 当前选中的资源列表。
   */
  value: PermissionResourcePanelValue;

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
  onChange: (resources: PermissionResourcePanelValue) => void;
}

/**
 * 通用权限资源编辑面板。
 *
 * 该面板统一承载三类资源输入：
 * 1. 菜单树勾选出的具体资源
 * 2. 后端扫描出的接口资源
 * 3. 与接口资源配套的自定义通配资源
 */
const PermissionResourcePanel = (props: PermissionResourcePanelProps) => {
  const mode = props.mode ?? 'full';
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [directCheckedMenuKeys, setDirectCheckedMenuKeys] = useState<string[]>(
    [],
  );
  const [checkedApiResources, setCheckedApiResources] = useState<string[]>([]);
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

  const apiResources = useMemo(() => {
    const resources = props.apiResources ?? [];
    const resourcesWithName = resources.map((item) => {
      return {
        ...item,
        name: item.resource,
      };
    });
    return filterAssignableMenuNodes(
      resourcesWithName,
      props.tenantId,
      props.userId,
    ).map((item) => {
      const { name, ...rest } = item;
      return {
        ...rest,
        resource: name,
      };
    });
  }, [props.apiResources, props.tenantId, props.userId]);

  const menuSelectableResourceNameSet = useMemo(() => {
    return new Set(menus.map((item) => item.name));
  }, [menus]);

  const apiSelectableResourceNameSet = useMemo(() => {
    return new Set(apiResources.map((item) => item.resource));
  }, [apiResources]);

  useEffect(() => {
    const nextMenuResources = splitPermissionResources(
      props.value.menuResources,
      menus,
      menuSelectableResourceNameSet,
    );
    const nextApiResources = splitPermissionResources(
      props.value.apiResources,
      [],
      apiSelectableResourceNameSet,
    );
    setDirectCheckedMenuKeys(nextMenuResources.directCheckedKeys);
    setCheckedApiResources(nextApiResources.directCheckedKeys);
    setExtraText(nextApiResources.extraText);
  }, [
    apiSelectableResourceNameSet,
    menuSelectableResourceNameSet,
    menus,
    props.value.apiResources,
    props.value.menuResources,
  ]);

  const checkedMenuKeys = useMemo(() => {
    return collectWithAncestors(directCheckedMenuKeys, menus);
  }, [directCheckedMenuKeys, menus]);

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
    return buildTreeNodes(
      filteredMenus,
      searchValue,
      props.menuApiUsageCountMap,
    );
  }, [filteredMenus, props.menuApiUsageCountMap, searchValue]);

  const filteredApiResources = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return apiResources;
    }

    return apiResources.filter((item) => {
      if (item.resource.toLowerCase().includes(keyword)) {
        return true;
      }
      if (item.title.toLowerCase().includes(keyword)) {
        return true;
      }
      return item.methods.some((method) => {
        return method.toLowerCase().includes(keyword);
      });
    });
  }, [apiResources, searchValue]);

  const emitResourceChange = (
    nextDirectCheckedMenuKeys: string[],
    nextCheckedApiResources: string[],
    nextExtraText: string,
  ) => {
    props.onChange({
      menuResources: buildPermissionResourceValue(
        nextDirectCheckedMenuKeys,
        menus,
        '',
      ),
      apiResources: Array.from(
        new Set([
          ...nextCheckedApiResources,
          ...parseExtraResources(nextExtraText),
        ]),
      ),
    });
  };

  const handleCheck = (keys: unknown, info: unknown) => {
    const action = resolveTreeCheckAction(info);
    let nextDirectCheckedKeys = directCheckedMenuKeys;

    if (action.key) {
      if (action.checked) {
        nextDirectCheckedKeys = addNodeAndDescendants(
          directCheckedMenuKeys,
          action.key,
          menus,
        );
      }

      if (action.checked === false) {
        nextDirectCheckedKeys = removeNodeAndDescendants(
          directCheckedMenuKeys,
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

    setDirectCheckedMenuKeys(nextDirectCheckedKeys);
    props.onDirectMenuChange?.(nextDirectCheckedKeys);
    emitResourceChange(nextDirectCheckedKeys, checkedApiResources, extraText);
  };

  const handleApiResourceChange = (resource: string, checked: boolean) => {
    let nextCheckedApiResources = checkedApiResources;
    if (checked) {
      nextCheckedApiResources = Array.from(
        new Set([...checkedApiResources, resource]),
      );
    }
    if (!checked) {
      nextCheckedApiResources = checkedApiResources.filter((item) => {
        return item !== resource;
      });
    }

    setCheckedApiResources(nextCheckedApiResources);
    emitResourceChange(directCheckedMenuKeys, nextCheckedApiResources, extraText);
  };

  const menuTree = (
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
            checkedKeys={checkedMenuKeys.filter((item) => menuNameSet.has(item))}
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
  );

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
              const nextMenuResources = menus.map((item) => item.name);
              const nextApiResources = apiResources.map((item) => item.resource);
              setDirectCheckedMenuKeys(nextMenuResources);
              props.onDirectMenuChange?.(nextMenuResources);
              setCheckedApiResources(nextApiResources);
              emitResourceChange(nextMenuResources, nextApiResources, extraText);
            }}
          >
            全选
          </Button>
          <Button
            size={'small'}
            disabled={props.loading}
            onClick={() => {
              setDirectCheckedMenuKeys([]);
              props.onDirectMenuChange?.([]);
              setCheckedApiResources([]);
              emitResourceChange([], [], extraText);
            }}
          >
            清空树选择
          </Button>
        </Flex>

        {mode === 'menuOnly' ? (
          menuTree
        ) : (
          <Tabs
            style={{ padding: '0 8px 8px' }}
            items={[
              {
                key: 'menu',
                label: '菜单资源',
                children: menuTree,
              },
              {
                key: 'api',
                label: '接口资源',
                children: (
                  <Flex vertical gap={16}>
                    <div
                      style={{
                        padding: '8px 12px',
                        minHeight: 240,
                        maxHeight: 400,
                        overflowY: 'auto',
                      }}
                    >
                      <Spin spinning={Boolean(props.loading)}>
                        {filteredApiResources.length > 0 ? (
                          <Space
                            direction={'vertical'}
                            size={12}
                            style={{ width: '100%' }}
                          >
                            {filteredApiResources.map((item) => {
                              return (
                                <Checkbox
                                  key={item.resource}
                                  checked={checkedApiResources.includes(
                                    item.resource,
                                  )}
                                  onChange={(event) => {
                                    handleApiResourceChange(
                                      item.resource,
                                      event.target.checked,
                                    );
                                  }}
                                  style={{ width: '100%' }}
                                >
                                  <Space direction={'vertical'} size={2}>
                                    <Typography.Text>{item.title}</Typography.Text>
                                    <Typography.Text type={'secondary'}>
                                      {item.resource}
                                    </Typography.Text>
                                    <Space size={4} wrap>
                                      {item.methods.map((method) => {
                                        return (
                                          <Tag
                                            key={`${item.resource}-${method}`}
                                            color={'blue'}
                                          >
                                            {method}
                                          </Tag>
                                        );
                                      })}
                                    </Space>
                                  </Space>
                                </Checkbox>
                              );
                            })}
                          </Space>
                        ) : (
                          <Empty
                            description={searchValue ? '未找到匹配接口资源' : '暂无接口资源'}
                            style={{ marginTop: 20 }}
                          />
                        )}
                      </Spin>
                    </div>

                    <Input.TextArea
                      rows={6}
                      value={extraText}
                      placeholder={'每行一个自定义资源，例如：/project/* 或 /project/**'}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setExtraText(nextValue);
                        emitResourceChange(
                          directCheckedMenuKeys,
                          checkedApiResources,
                          nextValue,
                        );
                      }}
                    />
                  </Flex>
                ),
              },
            ]}
          />
        )}
      </div>
    </Flex>
  );
};

export default PermissionResourcePanel;
