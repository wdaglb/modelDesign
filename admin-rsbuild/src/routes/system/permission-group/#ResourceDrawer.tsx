import React, { useContext, useEffect, useState } from 'react';
import { Button, Flex, message } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiMenu, ApiPermissionGroup } from '@/api';
import type { Menu } from '@/api/modules/menu.types.ts';
import type { PermissionGroup } from '@/api/modules/permission-group';
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
  const [resources, setResources] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: menuList = [], isLoading: menuLoading } = useQuery({
    queryKey: ['permissionGroupMenuList'],
    queryFn: () => ApiMenu.getList(),
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
    setResources(groupResources.resources || []);
  }, [groupResources]);

  return (
    <Flex vertical gap={16}>
      <PermissionResourcePanel
        menuList={menuList as Menu[]}
        value={resources}
        tenantId={currentInfo?.tenantId}
        userId={currentInfo?.userId}
        loading={menuLoading || groupLoading}
        onChange={setResources}
      />

      <Flex justify={'flex-end'} gap={8}>
        <Button onClick={() => ctx.close()}>取消</Button>
        <Button
          type={'primary'}
          loading={submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await ApiPermissionGroup.updateResources(group.code, resources);
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
