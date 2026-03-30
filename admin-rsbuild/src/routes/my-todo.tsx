import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card } from 'antd';

import TodoTable from './my-todo/#TodoTable';

/**
 * 我的待办页面路由。
 *
 * 当前页面仅负责页面级容器组装，具体的列表查询、筛选与字段展示
 * 统一下沉到私有子组件 `#TodoTable` 中处理。
 */
export const Route = createFileRoute('/my-todo')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <TodoTable />
    </Card>
  );
}
