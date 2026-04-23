import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import DeviceTable from './#DeviceTable';

/**
 * 设备台账路由页。
 */
export const Route = createFileRoute('/asset/device/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <DeviceTable />
    </Card>
  );
}
