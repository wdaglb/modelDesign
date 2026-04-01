import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card } from 'antd';

import TenantTable from './#TenantTable';

/**
 * 租户管理页面路由。
 */
export const Route = createFileRoute('/system/tenant/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <TenantTable />
    </Card>
  );
}
