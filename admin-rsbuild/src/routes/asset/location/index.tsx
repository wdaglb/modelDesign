import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import LocationTable from './#LocationTable';

/**
 * 设备位置路由页。
 */
export const Route = createFileRoute('/asset/location/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <LocationTable />
    </Card>
  );
}
