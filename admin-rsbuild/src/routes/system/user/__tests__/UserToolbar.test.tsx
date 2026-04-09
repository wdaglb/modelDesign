import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import UserToolbar from '../#UserToolbar';

function ToolbarHarness(props: {
  selectedCount: number;
  advancedOpen: boolean;
  onSearch?: (value: string) => void;
  onOpenBatch?: () => void;
}) {
  const [keyword, setKeyword] = useState('');

  return (
    <UserToolbar
      keyword={keyword}
      advancedOpen={props.advancedOpen}
      selectedCount={props.selectedCount}
      onKeywordChange={setKeyword}
      onSearch={props.onSearch || vi.fn()}
      onToggleAdvanced={vi.fn()}
      onOpenCreate={vi.fn()}
      onOpenBatch={props.onOpenBatch || vi.fn()}
    />
  );
}

describe('UserToolbar', () => {
  it('点击搜索会把 keyword 传回父级', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <ToolbarHarness
        selectedCount={0}
        advancedOpen={false}
        onSearch={onSearch}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('搜索用户名 / 昵称 / 用户 ID'),
      'alice',
    );
    await user.click(screen.getByRole('button', { name: /搜\s*索/ }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0]?.[0]).toBe('alice');
  });

  it('选中行存在时允许打开批量操作', async () => {
    const user = userEvent.setup();
    const onOpenBatch = vi.fn();

    render(
      <ToolbarHarness
        selectedCount={2}
        advancedOpen={true}
        onOpenBatch={onOpenBatch}
      />,
    );

    await user.click(screen.getByRole('button', { name: '批量操作' }));

    expect(onOpenBatch).toHaveBeenCalledTimes(1);
  });
});
