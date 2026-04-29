import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import CategoryTable from '../#CategoryTable';

const { mockCategoryItem, mockOpen } = vi.hoisted(() => {
  return {
    mockCategoryItem: {
      id: 9,
      tenantId: 1001,
      name: '办公设备',
      sort: 10,
      status: 1,
      remark: '常用办公资产',
    },
    mockOpen: vi.fn(),
  };
});

vi.mock('@/components/KModal', () => {
  return {
    useKModal: () => ({
      open: mockOpen,
    }),
  };
});

vi.mock('../#CategoryDeleteModal', () => {
  return {
    default: () => <div>分类删除弹窗</div>,
  };
});

vi.mock('@/components', async () => {
  const actual =
    await vi.importActual<typeof import('@/components')>('@/components');

  const MockKTable: any = (props: any) => {
    const actionColumn = props.columns.find(
      (item: any) => item.key === 'action',
    );
    return (
      <div>
        <div>{props.toolbar}</div>
        <div>{actionColumn.render(null, mockCategoryItem)}</div>
        <div data-testid={'row-selection-enabled'}>
          {props.rowSelection ? 'enabled' : 'disabled'}
        </div>
      </div>
    );
  };

  MockKTable.Button = (props: any) => {
    return (
      <button type={'button'} disabled={props.disabled} onClick={props.onClick}>
        {props.children}
      </button>
    );
  };

  return {
    ...actual,
    KTable: MockKTable,
  };
});

describe('CategoryTable', () => {
  it('should render create edit and delete buttons', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <CategoryTable />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('新建分类')).toBeTruthy();
    expect(await screen.findByText('编辑')).toBeTruthy();
    expect(await screen.findByText('删除')).toBeTruthy();
    expect(await screen.findByText('批量删除')).toBeTruthy();
    const rowSelectionState = await screen.findByTestId('row-selection-enabled');

    expect(rowSelectionState.textContent).toBe('enabled');
  });

  it('should disable batch delete button when no rows selected', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <CategoryTable />
      </QueryClientProvider>,
    );

    const batchDeleteButton = await screen.findByRole('button', {
      name: '批量删除',
    });

    expect((batchDeleteButton as HTMLButtonElement).disabled).toBe(true);
  });
});
