import { useCallback, useRef, useState } from 'react';
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

  /**
   * 登录成功后使用浏览器级跳转进入目标页。
   *
   * 当前缺陷的表现是：
   * 1. 登录后停留在登录页；
   * 2. 但刷新登录页或手动输入首页后又能正常进入。
   *
   * 这说明 token 持久化本身没有问题，异常集中在当前这次 SPA 内部跳转。
   * 因此这里不再依赖客户端路由状态同步，而是直接复用浏览器导航，
   * 让应用按“刷新后可进入”的已验证链路重新启动并执行根路由守卫。
   *
   * @param accessToken 新 access token
   * @param refreshToken 新 refresh token
   */
  const initializeSessionAndNavigate = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setTokens(accessToken, refreshToken);
      window.location.replace(redirectTarget);
    },
    [redirectTarget, setTokens],
  );

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: async (data) => {
      await initializeSessionAndNavigate(data.accessToken, data.refreshToken);
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
    onSuccess: async (data) => {
      await initializeSessionAndNavigate(data.accessToken, data.refreshToken);
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
  const switchPanel = useCallback(
    (target: PanelType) => {
      if (transitionState !== 'idle') {
        return;
      }
      pendingPanelRef.current = target;
      setTransitionState('exiting');
    },
    [transitionState],
  );

  /** 过渡动画结束回调 */
  const handleTransitionEnd = useCallback(() => {
    if (transitionState === 'exiting') {
      if (pendingPanelRef.current) {
        setActivePanel(pendingPanelRef.current);
        pendingPanelRef.current = null;
      }
      setTransitionState('entering');
    } else if (transitionState === 'entering') {
      setTransitionState('idle');
    }
  }, [transitionState]);

  /**
   * 骨架屏完成后只推进一次首屏面板切换，避免子组件 effect
   * 因回调引用变化而重复调度切换状态。
   */
  const handleSkeletonReady = useCallback(() => {
    if (activePanel === 'skeleton' && transitionState === 'idle') {
      switchPanel('password');
    }
  }, [activePanel, switchPanel, transitionState]);

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
