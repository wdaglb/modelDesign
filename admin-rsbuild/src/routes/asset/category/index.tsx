import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import CategoryTable from './#CategoryTable';

/**
 * 设备分类路由页。
 */
export const Route = createFileRoute('/asset/category/')({
  component: RouteComponent,
});

/**
 * 渲染设备分类管理页面。
 *
 * @returns 设备分类管理页面内容
 */
function RouteComponent() {
  return (
    <Card>
      <CategoryTable />
    </Card>
  );
}
