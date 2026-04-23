import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import StocktakeTaskTable from '../#StocktakeTaskTable';

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
    return <div>{props.toolbar}</div>;
  };

  MockKTable.Button = (props: any) => {
    return <button type={'button'}>{props.children}</button>;
  };

  return {
    ...actual,
    KTable: MockKTable,
  };
});

describe('StocktakeTaskTable', () => {
  it('should render create stocktake task button', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <StocktakeTaskTable />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('发起盘点')).toBeTruthy();
  });
});
