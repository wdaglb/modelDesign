import { useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Modal } from 'antd';
import { z } from 'zod';

import { ApiPassport } from '@/api';
import useAuthStore from '@/store/auth.ts';

import LoginPage, { type LoginFormValues } from './#LoginPage';

const searchSchema = z.object({
  redirect: z.string().optional().default('/'),
});

/** 面板类型：密码登录 / 扫码登录 / 骨架屏 */
export type PanelType = 'password' | 'qrScan' | 'skeleton';

/** 面板切换过渡状态 */
export type TransitionState = 'idle' | 'exiting' | 'entering';

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
  validateSearch: searchSchema,
  context: () => {
    return { title: '后台登录' };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const setToken = useAuthStore((state) => state.setToken);

  /** 当前激活的面板 */
  const [activePanel, setActivePanel] = useState<PanelType>('skeleton');

  /** 面板切换过渡状态 */
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');

  /** 面板切换目标 */
  const pendingPanelRef = useRef<PanelType | null>(null);

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: (data) => {
      setToken(data.token);
      navigate({ to: search.redirect, replace: true });
    },
    onError: (error) => {
      Modal.error({
        title: '登录失败',
        content: error.message || '登录失败，请稍后重试',
      });
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
      errorMessage={errorMessage}
      onSubmit={(values: LoginFormValues) => {
        return mutation.mutateAsync(values);
      }}
      onSwitchPanel={switchPanel}
      onTransitionEnd={handleTransitionEnd}
      onSkeletonReady={handleSkeletonReady}
    />
  );
}
