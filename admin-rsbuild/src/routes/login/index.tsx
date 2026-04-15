import { useRef, useState } from 'react';
import {
  createFileRoute,
  redirect,
} from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Modal } from 'antd';
import { z } from 'zod';

import { ApiPassport } from '@/api';
import { runAuthGuard } from '@/initialState.ts';
import {
  normalizeLoginRedirect,
  resolveLoginRouteRedirect,
} from '@/service/loginRedirect.ts';
import useAuthStore from '@/store/auth.ts';

import LoginPage, {
  type LoginFormValues,
  type RegisterSubmitValues,
} from './#LoginPage';

const searchSchema = z.object({
  redirect: z.string().optional().default('/'),
});

/** 面板类型：密码登录 / 扫码登录 / 骨架屏 */
export type PanelType = 'password' | 'qrScan' | 'skeleton';

/** 面板切换过渡状态 */
export type TransitionState = 'idle' | 'exiting' | 'entering';

export const Route = createFileRoute('/login/')({
  beforeLoad: async ({ search }) => {
    const authState = useAuthStore.getState();

    if (!authState.token) {
      return;
    }

    const redirectTarget = await resolveLoginRouteRedirect(
      search.redirect,
      runAuthGuard,
    );

    if (!redirectTarget) {
      return;
    }

    throw redirect({
      to: redirectTarget,
      replace: true,
    });
  },
  component: RouteComponent,
  validateSearch: searchSchema,
  context: () => {
    return { title: '后台登录' };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const setTokens = useAuthStore((state) => state.setTokens);
  const redirectTarget = normalizeLoginRedirect(search.redirect);

  /** 当前激活的面板 */
  const [activePanel, setActivePanel] = useState<PanelType>('skeleton');

  /** 面板切换过渡状态 */
  const [transitionState, setTransitionState] =
    useState<TransitionState>('idle');

  /** 面板切换目标 */
  const pendingPanelRef = useRef<PanelType | null>(null);

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate({ to: redirectTarget, replace: true });
    },
    onError: (error) => {
      Modal.error({
        title: '登录失败',
        content: error.message || '登录失败，请稍后重试',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ApiPassport.register,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate({ to: redirectTarget, replace: true });
    },
  });

  let errorMessage: string | undefined;
  if (mutation.isError) {
    errorMessage = mutation.error.message;
  }

  /**
   * 触发面板切换动画
   * @param target 目标面板
   */
  const switchPanel = (target: PanelType) => {
    if (transitionState !== 'idle') {
      return;
    }
    pendingPanelRef.current = target;
    setTransitionState('exiting');
  };

  /** 过渡动画结束回调 */
  const handleTransitionEnd = () => {
    if (transitionState === 'exiting') {
      if (pendingPanelRef.current) {
        setActivePanel(pendingPanelRef.current);
        pendingPanelRef.current = null;
      }
      setTransitionState('entering');
    } else if (transitionState === 'entering') {
      setTransitionState('idle');
    }
  };

  /** 首次挂载后延迟切换到 password 面板 */
  const handleSkeletonReady = () => {
    if (activePanel === 'skeleton' && transitionState === 'idle') {
      switchPanel('password');
    }
  };

  return (
    <LoginPage
      activePanel={activePanel}
      transitionState={transitionState}
      loading={mutation.isPending}
      registerLoading={registerMutation.isPending}
      errorMessage={errorMessage}
      onSubmit={async (values: LoginFormValues) => {
        return mutation.mutateAsync(values);
      }}
      onRegisterSubmit={async (values: RegisterSubmitValues) => {
        return registerMutation.mutateAsync(values);
      }}
      onSwitchPanel={switchPanel}
      onTransitionEnd={handleTransitionEnd}
      onSkeletonReady={handleSkeletonReady}
    />
  );
}
