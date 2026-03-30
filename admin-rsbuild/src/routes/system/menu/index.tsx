import { createFileRoute } from '@tanstack/react-router';
import { Card } from 'antd';
import React from 'react';

import { KTableProvider } from '@/components/KTable/context.tsx';

import SortTable from './#SortTable.tsx';

export const Route = createFileRoute('/system/menu/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <KTableProvider initialValue={{}}>
        <SortTable />
      </KTableProvider>
    </Card>
  );
}
