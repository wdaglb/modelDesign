import React from 'react';
import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import PermissionGroupTable from './#PermissionGroupTable';

/**
 * 权限资源组页面路由。
 */
export const Route = createFileRoute('/system/permission-group/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <PermissionGroupTable />
    </Card>
  );
}
