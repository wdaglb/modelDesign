import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Empty,
  Flex,
  Input,
  List,
  Tabs,
  Typography,
  message,
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ApiMenu,
  ApiPermissionGroup,
  ApiPermissionResource,
  ApiRole,
} from '@/api';
import type { Menu } from '@/api/modules/menu.types.ts';
import type { PermissionGroup } from '@/api/modules/permission-group';
import type { PermissionResourceCatalogItem } from '@/api/modules/permission-resource';
import type { Role } from '@/api/modules/role';
import PermissionResourcePanel from '@/components/business/PermissionResourcePanel';
import { modalContext } from '@/components/KModal/Modal.tsx';
import {
  buildShortcutApiUsageCountMap,
  collectAutoApiResourcesByMenuResources,
} from '@/constants/permissionGroupShortcut.ts';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

interface Props {
  role: Role;
}

/**
 * 角色权限配置抽屉。
 *
 * 当前同时支持编辑两类绑定：
 * 1. 直接绑定的资源组
 * 2. 菜单与按钮资源
 *
 * 接口资源不再允许手动勾选，而是根据菜单与按钮自动补齐。
 */
const PermissionDrawer = ({ role }: Props) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const [groupKeyword, setGroupKeyword] = useState('');
  const [selectedMenuResources, setSelectedMenuResources] = useState<string[]>([]);
  const [selectedGroupCodes, setSelectedGroupCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: menuList = [], isLoading: menuLoading } = useQuery({
    queryKey: ['rolePermissionMenuList'],
    queryFn: () => ApiMenu.getList(),
  });

  const { data: apiResources = [], isLoading: apiResourceLoading } = useQuery({
    queryKey: ['permissionResourceCatalog'],
    queryFn: () => ApiPermissionResource.getCatalog(),
  });

  const { data: permissionGroupList, isLoading: permissionGroupLoading } =
    useQuery({
      queryKey: [...queryKey.permissionGroup.list(), 'role-drawer'],
      queryFn: () =>
        ApiPermissionGroup.getPageList({
          current: 1,
          pageSize: 999,
        }),
    });

  const { data: permission, isLoading: permissionLoading } = useQuery({
    queryKey: queryKey.role.permission(role.code),
    queryFn: () => ApiRole.getPermission(role.code),
    staleTime: 0,
  });

  useEffect(() => {
    if (!permission) {
      return;
    }
    setSelectedMenuResources(permission.menuResources || []);
    setSelectedGroupCodes(permission.resourceGroupCodes || []);
  }, [permission]);

  const permissionGroups = useMemo(() => {
    const items = permissionGroupList?.items ?? [];
    return items.filter((item) => !item.isDisable);
  }, [permissionGroupList?.items]);

  const filteredPermissionGroups = useMemo(() => {
    const keyword = groupKeyword.trim();
    if (!keyword) {
      return permissionGroups;
    }
    return permissionGroups.filter((item) => {
      return item.name.includes(keyword) || item.code.includes(keyword);
    });
  }, [groupKeyword, permissionGroups]);

  const menuApiUsageCountMap = useMemo(() => {
    const availableResourceSet = new Set(
      (apiResources as PermissionResourceCatalogItem[]).map((item) => item.resource),
    );
    const originalCountMap = buildShortcutApiUsageCountMap();
    return Object.fromEntries(
      Object.entries(originalCountMap).map(([resource, count]) => {
        if (count === 0) {
          return [resource, 0];
        }

        const autoApiResources = collectAutoApiResourcesByMenuResources([resource]);
        const filteredApiResources = autoApiResources.filter((item) => {
          return availableResourceSet.has(item);
        });
        return [resource, filteredApiResources.length];
      }),
    );
  }, [apiResources]);

  const matchedShortcutApiResources = useMemo(() => {
    const availableResourceSet = new Set(
      (apiResources as PermissionResourceCatalogItem[]).map((item) => item.resource),
    );
    return collectAutoApiResourcesByMenuResources(selectedMenuResources).filter(
      (item) => {
        return availableResourceSet.has(item);
      },
    );
  }, [apiResources, selectedMenuResources]);

  const effectiveSelectedApiResources = useMemo(() => {
    return matchedShortcutApiResources;
  }, [matchedShortcutApiResources]);

  const isLoading =
    menuLoading ||
    permissionGroupLoading ||
    permissionLoading ||
    apiResourceLoading;

  const groupContent = renderGroupContent({
    filteredPermissionGroups,
    groupKeyword,
    loading: isLoading,
    selectedGroupCodes,
    onKeywordChange: setGroupKeyword,
    onSelectedGroupCodesChange: setSelectedGroupCodes,
  });

  const resourceContent = renderResourceContent({
    loading: isLoading,
    menuApiUsageCountMap,
    menuList: menuList as Menu[],
    onMenuResourcesChange: setSelectedMenuResources,
    selectedMenuResources,
    tenantId: currentInfo?.tenantId,
    userId: currentInfo?.userId,
  });

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await ApiRole.updatePermission(role.code, {
        menuResources: selectedMenuResources,
        apiResources: effectiveSelectedApiResources,
        resourceGroupCodes: selectedGroupCodes,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKey.role.permission(role.code),
      });
      message.success('权限保存成功');
      ctx.resolve();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Tabs
        items={[
          {
            key: 'group',
            label: '资源组',
            children: groupContent,
          },
          {
            key: 'resource',
            label: '权限资源',
            children: resourceContent,
          },
        ]}
      />

      <Flex justify={'flex-end'} gap={8}>
        <Typography.Text type={'secondary'} style={{ flex: 1 }}>
          保存时会同时提交资源组绑定、菜单资源以及菜单自动补齐的接口资源。
        </Typography.Text>
        <Button onClick={() => ctx.close()}>取消</Button>
        <Button
          type={'primary'}
          loading={submitting}
          onClick={handleSave}
        >
          保存
        </Button>
      </Flex>
    </Flex>
  );
};

interface GroupContentProps {
  filteredPermissionGroups: PermissionGroup[];
  groupKeyword: string;
  loading: boolean;
  selectedGroupCodes: string[];
  onKeywordChange: (keyword: string) => void;
  onSelectedGroupCodesChange: (groupCodes: string[]) => void;
}

interface ResourceContentProps {
  loading: boolean;
  menuApiUsageCountMap: Record<string, number>;
  menuList: Menu[];
  onMenuResourcesChange: (resources: string[]) => void;
  selectedMenuResources: string[];
  tenantId?: number;
  userId?: number;
}

function renderResourceContent(props: ResourceContentProps) {
  return (
    <PermissionResourcePanel
      mode={'menuOnly'}
      menuApiUsageCountMap={props.menuApiUsageCountMap}
      menuList={props.menuList}
      apiResources={[]}
      value={{
        menuResources: props.selectedMenuResources,
        apiResources: [],
      }}
      tenantId={props.tenantId}
      userId={props.userId}
      loading={props.loading}
      onChange={(value) => {
        props.onMenuResourcesChange(value.menuResources);
      }}
    />
  );
}

function renderGroupContent(props: GroupContentProps) {
  return (
    <Flex vertical gap={16}>
      <Input
        allowClear
        placeholder={'搜索资源组名称或编码'}
        value={props.groupKeyword}
        onChange={(event) => {
          props.onKeywordChange(event.target.value);
        }}
      />

      <Checkbox.Group
        style={{ width: '100%' }}
        value={props.selectedGroupCodes}
        onChange={(values) => {
          props.onSelectedGroupCodesChange(
            values.map((item) => String(item)),
          );
        }}
      >
        <List
          bordered
          loading={props.loading}
          locale={{
            emptyText: (
              <Empty
                description={
                  props.groupKeyword ? '未找到匹配资源组' : '暂无可用资源组'
                }
              />
            ),
          }}
          dataSource={props.filteredPermissionGroups}
          renderItem={(item) => {
            return (
              <List.Item>
                <Checkbox value={item.code} style={{ width: '100%' }}>
                  <Flex vertical gap={4}>
                    <Typography.Text strong>{item.name}</Typography.Text>
                    <Typography.Text type={'secondary'}>
                      {item.code}
                    </Typography.Text>
                    {item.remark ? (
                      <Typography.Text type={'secondary'}>
                        {item.remark}
                      </Typography.Text>
                    ) : null}
                  </Flex>
                </Checkbox>
              </List.Item>
            );
          }}
        />
      </Checkbox.Group>
    </Flex>
  );
}

export default PermissionDrawer;
