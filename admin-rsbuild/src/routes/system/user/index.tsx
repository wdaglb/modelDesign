import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card } from 'antd';

import UserTable from './#UserTable';

/**
 * 用户管理页面路由。
 *
 * 当前页面仅负责页面级容器组装，具体的列表查询、批量操作、
 * 新增编辑弹窗等逻辑统一下沉到私有子组件 `#UserTable` 中处理。
 */
export const Route = createFileRoute('/system/user/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <UserTable />
    </Card>
  );
}
