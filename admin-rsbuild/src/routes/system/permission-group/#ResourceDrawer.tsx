import React, { useContext, useEffect, useState } from 'react';
import { Button, Flex, message } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiMenu, ApiPermissionGroup, ApiPermissionResource } from '@/api';
import type { Menu } from '@/api/modules/menu.types.ts';
import type { PermissionGroup } from '@/api/modules/permission-group';
import type { PermissionResourceCatalogItem } from '@/api/modules/permission-resource';
import PermissionResourcePanel from '@/components/business/PermissionResourcePanel';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

interface Props {
  group: PermissionGroup;
}

/**
 * 资源组资源配置抽屉。
 */
const ResourceDrawer = ({ group }: Props) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const [menuResources, setMenuResources] = useState<string[]>([]);
  const [apiResourcesValue, setApiResourcesValue] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: menuList = [], isLoading: menuLoading } = useQuery({
    queryKey: ['permissionGroupMenuList'],
    queryFn: () => ApiMenu.getList(),
  });

  const { data: apiResources = [], isLoading: apiResourceLoading } = useQuery({
    queryKey: ['permissionResourceCatalog'],
    queryFn: () => ApiPermissionResource.getCatalog(),
  });

  const { data: groupResources, isLoading: groupLoading } = useQuery({
    queryKey: queryKey.permissionGroup.resources(group.code),
    queryFn: () => ApiPermissionGroup.getResources(group.code),
    staleTime: 0,
  });

  useEffect(() => {
    if (!groupResources) {
      return;
    }
    setMenuResources(groupResources.menuResources || []);
    setApiResourcesValue(groupResources.apiResources || []);
  }, [groupResources]);

  return (
    <Flex vertical gap={16}>
      <PermissionResourcePanel
        menuList={menuList as Menu[]}
        apiResources={apiResources as PermissionResourceCatalogItem[]}
        value={{
          menuResources,
          apiResources: apiResourcesValue,
        }}
        tenantId={currentInfo?.tenantId}
        userId={currentInfo?.userId}
        loading={menuLoading || groupLoading || apiResourceLoading}
        onChange={(value) => {
          setMenuResources(value.menuResources);
          setApiResourcesValue(value.apiResources);
        }}
      />

      <Flex justify={'flex-end'} gap={8}>
        <Button onClick={() => ctx.close()}>取消</Button>
        <Button
          type={'primary'}
          loading={submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await ApiPermissionGroup.updateResources(group.code, {
                menuResources,
                apiResources: apiResourcesValue,
              });
              await queryClient.invalidateQueries({
                queryKey: queryKey.permissionGroup.resources(group.code),
              });
              message.success('资源组资源保存成功');
              ctx.resolve();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          保存
        </Button>
      </Flex>
    </Flex>
  );
};

export default ResourceDrawer;
