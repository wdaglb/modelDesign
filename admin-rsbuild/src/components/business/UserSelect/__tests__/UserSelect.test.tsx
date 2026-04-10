import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import UserSelect from '../index';

const { getPageListMock } = vi.hoisted(() => {
  return {
    getPageListMock: vi.fn(),
  };
});

vi.mock('@/api', () => {
  return {
    ApiUser: {
      getPageList: getPageListMock,
    },
  };
});

vi.mock('@/hooks/useDebounce', () => {
  return {
    default: <T,>(value: T) => value,
  };
});

describe('UserSelect', () => {
  beforeEach(() => {
    localStorage.clear();
    getPageListMock.mockReset();
    getPageListMock.mockResolvedValue({
      items: [
        {
          id: 1,
          nickname: '张三',
          username: 'zhangsan',
          avatarId: '',
        },
      ],
      total: 1,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('输入关键字后会按统一 keyword 条件发起远程搜索', async () => {
    const user = userEvent.setup();

    renderWithQuery(<UserSelect />);

    /**
     * 远程搜索模式下需要先聚焦 Select 输入框，
     * 才能让 Ant Design 把输入内容交给 onSearch。
     */
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'zhangsan');

    await waitFor(() => {
      expect(getPageListMock).toHaveBeenLastCalledWith({
        keyword: 'zhangsan',
        current: 1,
        pageSize: 20,
      });
    });
  });

  it('默认占位文案会提示支持用户名昵称和用户 ID 搜索', () => {
    renderWithQuery(<UserSelect />);

    expect(
      screen.getByPlaceholderText('请输入用户名、昵称或用户 ID'),
    ).toBeDefined();
  });
});

/**
 * 为每个测试用例提供独立的查询上下文，
 * 避免 react-query 缓存影响断言结果。
 *
 * @param component 待渲染组件
 * @return 渲染结果
 */
function renderWithQuery(component: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}
