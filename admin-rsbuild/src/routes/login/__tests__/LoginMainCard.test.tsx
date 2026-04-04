import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginMainCard from '../#LoginMainCard';

describe('LoginMainCard', () => {
  it('提交空表单时显示必填校验', async () => {
    const user = userEvent.setup();
    render(
      <LoginMainCard
        loading={false}
        onSubmit={vi.fn()}
        onOpenRegister={vi.fn()}
        onOpenForgot={vi.fn()}
        onSwitchToQR={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '确认登录' }));

    expect(await screen.findByText('请输入账号')).toBeDefined();
    expect(await screen.findByText('请输入密码')).toBeDefined();
  });

  it('点击注册入口触发回调', async () => {
    const user = userEvent.setup();
    const onOpenRegister = vi.fn();

    render(
      <LoginMainCard
        loading={false}
        onSubmit={vi.fn()}
        onOpenRegister={onOpenRegister}
        onOpenForgot={vi.fn()}
        onSwitchToQR={vi.fn()}
      />,
    );

    await user.click(screen.getByText('没有账号？立即注册'));
    expect(onOpenRegister).toHaveBeenCalledTimes(1);
  });

  it('点击找回密码触发回调', async () => {
    const user = userEvent.setup();
    const onOpenForgot = vi.fn();

    render(
      <LoginMainCard
        loading={false}
        onSubmit={vi.fn()}
        onOpenRegister={vi.fn()}
        onOpenForgot={onOpenForgot}
        onSwitchToQR={vi.fn()}
      />,
    );

    await user.click(screen.getByText('忘记密码'));
    expect(onOpenForgot).toHaveBeenCalledTimes(1);
  });
});
