import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiTenant } from '@/api';

import LoginRegisterModal from '../#Login-RegisterModal';

vi.mock('@/api', () => {
  return {
    ApiTenant: {
      getOptions: vi.fn(),
    },
  };
});

describe('LoginRegisterModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 渲染注册弹窗。
   */
  const renderModal = (onSubmit = vi.fn()) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginRegisterModal
          open
          loading={false}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />
      </QueryClientProvider>,
    );

    return { onSubmit };
  };

  it('密码确认不一致时阻止提交', async () => {
    vi.mocked(ApiTenant.getOptions).mockResolvedValue([
      {
        id: 1,
        code: 'alpha',
        name: 'Alpha租户',
      },
    ]);
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    const submitButton = screen.getByRole('button', {
      name: '注册并进入系统',
    });
    expect(submitButton.getAttribute('type')).toBe('submit');
    fireEvent.change(screen.getByLabelText('昵称'), {
      target: { value: '测试用户' },
    });
    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'tester' },
    });
    fireEvent.change(screen.getByLabelText('登录密码'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('确认密码'), {
      target: { value: 'password456' },
    });
    await user.click(screen.getByRole('button', { name: '注册并进入系统' }));

    expect(await screen.findByText('两次输入的密码不一致')).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('校验通过时仅提交后端需要的注册字段', async () => {
    vi.mocked(ApiTenant.getOptions).mockResolvedValue([
      {
        id: 1,
        code: 'default',
        name: '默认租户',
      },
    ]);
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal(onSubmit);

    fireEvent.change(screen.getByLabelText('昵称'), {
      target: { value: '新用户' },
    });
    fireEvent.change(screen.getByLabelText('用户名'), {
      target: { value: 'new-user' },
    });
    fireEvent.change(screen.getByLabelText('登录密码'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('确认密码'), {
      target: { value: 'password123' },
    });
    await user.click(screen.getByRole('button', { name: '注册并进入系统' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      nickname: '新用户',
      username: 'new-user',
      tenantId: 1,
      password: 'password123',
    });
  });
});
