import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import DeviceTable from '../#DeviceTable';

const { mockDeviceItem } = vi.hoisted(() => {
  return {
    mockDeviceItem: {
      id: 11,
      tenantId: 1001,
      deviceName: 'ThinkPad X1',
      categoryId: 3,
      assetCode: 'NB-1001',
      serialNumber: 'SN-1001',
      status: 1,
      locationId: 5,
      currentUserId: undefined,
      remark: '',
    },
  };
});

vi.mock('@/components/KModal', () => {
  return {
    useKModal: () => ({
      open: vi.fn(),
    }),
  };
});

vi.mock('@/components', async () => {
  const actual = await vi.importActual<typeof import('@/components')>(
    '@/components',
  );

  const MockKTable: any = (props: any) => {
    const actionColumn = props.columns.find((item: any) => item.key === 'action');
    return (
      <div>
        <div>{props.toolbar}</div>
        <div>{actionColumn.render(null, mockDeviceItem)}</div>
      </div>
    );
  };

  MockKTable.Button = (props: any) => {
    return <button type={'button'}>{props.children}</button>;
  };

  MockKTable.ConfirmButton = (props: any) => {
    return <button type={'button'}>{props.children}</button>;
  };

  return {
    ...actual,
    KTable: MockKTable,
  };
});

describe('DeviceTable', () => {
  it('should show receive action for in-stock device', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <DeviceTable />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('领用')).toBeTruthy();
  });
});
