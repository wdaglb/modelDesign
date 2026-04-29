import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiPassport } from '@/api';

import BasicInfoTab from '../#BasicInfoTab';

vi.mock('@/api', () => {
  return {
    ApiPassport: {
      updateCurrentProfile: vi.fn(),
    },
  };
});

vi.mock('@/components', () => {
  return {
    KUpload: {
      Image: (props: { value?: string; onChange?: (value: string) => void }) => {
        return (
          <input
            aria-label={'头像'}
            value={props.value || ''}
            onChange={(event) => {
              props.onChange?.(event.target.value);
            }}
          />
        );
      },
    },
  };
});

describe('BasicInfoTab', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('保存基础信息时会提交 git 用户名并在成功后回调最新数据', async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });
    const nextCurrentInfo = {
      userId: 1,
      username: 'zhangsan',
      nickname: '张三',
      gitUsername: 'alice-dev',
      avatarId: 'avatar-1',
      tenantId: 100,
      loginId: 'login-1',
      loginIp: '127.0.0.1',
      tokenCreateTime: '2026-04-21 09:00:00',
    };
    vi.mocked(ApiPassport.updateCurrentProfile).mockResolvedValue(nextCurrentInfo);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BasicInfoTab
          currentInfo={{
            ...nextCurrentInfo,
            gitUsername: '',
          }}
          onUpdated={onUpdated}
        />
      </QueryClientProvider>,
    );

    const gitUsernameInput = screen.getByLabelText('Git 用户名');
    await user.clear(gitUsernameInput);
    await user.type(gitUsernameInput, '  alice-dev  ');
    await user.click(screen.getByRole('button', { name: '保存基础信息' }));

    await waitFor(() => {
      expect(ApiPassport.updateCurrentProfile).toHaveBeenCalledWith({
        nickname: '张三',
        avatarId: 'avatar-1',
        gitUsername: 'alice-dev',
      });
    });
    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(nextCurrentInfo);
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('基础信息保存成功');
    });
  });
});
