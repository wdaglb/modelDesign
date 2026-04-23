import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import StocktakeTaskTable from './#StocktakeTaskTable';

/**
 * 盘点任务路由页。
 */
export const Route = createFileRoute('/asset/stocktake/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <StocktakeTaskTable />
    </Card>
  );
}
