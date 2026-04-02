import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card } from 'antd';

import PositionTable from './#PositionTable';

/**
 * 职位管理页面路由。
 */
export const Route = createFileRoute('/system/position/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <PositionTable />
    </Card>
  );
}
