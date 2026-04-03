# 登录页画布重构（login.pen）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有登录接口逻辑的前提下，按 `ui/login.pen` 重构 `/login` 页面，实现密码登录/QR扫描/骨架屏三面板切换、霓虹灯动画侧栏、注册与找回密码弹窗。

**Architecture:** 路由入口保持 `ApiPassport.passwordLogin`、`setToken` 和 `redirect` 跳转逻辑不变。登录相关文件收敛到 `src/routes/login/` 目录。页面采用"背景包装层 + children slot 插入当前 panel"模式，panel 切换通过 CSS `transition: opacity` + `onTransitionEnd` 实现按需挂载+淡入淡出。注册/找回弹窗使用 Ant Design `Modal` 组件，仅做本地校验与反馈。通过 Vitest + Testing Library 补充最小可维护测试集。

**Tech Stack:** React 18、TypeScript、TanStack Router、TanStack Query、Ant Design v6、styled-components、Vitest、Testing Library

---

## 文件结构与职责

### 新增文件

- `admin-rsbuild/vitest.config.ts` — Vitest 运行配置（jsdom、别名、setup）
- `admin-rsbuild/src/test/setup.ts` — 测试通用初始化（cleanup）
- `admin-rsbuild/src/routes/login/index.tsx` — 路由入口，承接旧 `login.tsx` 的 mutation/token/redirect 逻辑 + panel 切换状态调度
- `admin-rsbuild/src/routes/login/#LoginPage.tsx` — 登录页面编排（品牌区 + 背景层 + panel slot + 弹窗绑定）
- `admin-rsbuild/src/routes/login/#LoginMainCard.tsx` — 密码登录主卡片（表单、错误提示、注册/找回入口）
- `admin-rsbuild/src/routes/login/#Login-QRScan.tsx` — QR 扫描登录面板（useQuery 轮询 + 超时处理）
- `admin-rsbuild/src/routes/login/#Login-Skeleton.tsx` — 过渡骨架屏面板
- `admin-rsbuild/src/routes/login/#Login-Background.tsx` — 背景包装层（霓虹灯动画 + children slot）
- `admin-rsbuild/src/routes/login/#Login-NeonAnimation.tsx` — 左侧栏三组霓虹灯动画条
- `admin-rsbuild/src/routes/login/#Login-RegisterModal.tsx` — 注册弹窗（展示级，不接后端）
- `admin-rsbuild/src/routes/login/#Login-ForgotPasswordModal.tsx` — 找回密码弹窗（展示级，不接后端）
- `admin-rsbuild/src/routes/login/#styles.tsx` — styled-components 动画样式（霓虹灯、panel 过渡）
- `admin-rsbuild/src/routes/login/#login.styled.tsx` — 页面整体与品牌区样式（浅色科技风，从旧文件迁移并调整）
- `admin-rsbuild/src/routes/login/#login-form.styled.tsx` — 登录卡片与表单样式（从旧文件迁移）
- `admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx` — 主卡片交互测试

### 删除文件

- `admin-rsbuild/src/routes/login.tsx` — 迁移到 `login/index.tsx` 后删除
- `admin-rsbuild/src/routes/#LoginPage.tsx` — 拆分后删除
- `admin-rsbuild/src/routes/#login.styled.tsx` — 迁移到 `login/` 目录后删除
- `admin-rsbuild/src/routes/#login-form.styled.tsx` — 迁移到 `login/` 目录后删除

### 修改文件

- `admin-rsbuild/package.json` — 增加测试脚本（test 依赖已安装）
- `admin-rsbuild/src/routeTree.gen.ts` — 路由插件自动更新，不手改

---

## Task 1: 搭建测试基线与 Vitest 配置

**Files:**
- Modify: `admin-rsbuild/package.json`
- Create: `admin-rsbuild/vitest.config.ts`
- Create: `admin-rsbuild/src/test/setup.ts`

测试依赖（`vitest`、`@testing-library/react`、`@testing-library/user-event`、`jsdom`）已安装在 `devDependencies` 中，无需重复安装。

- [ ] **Step 1: 在 `package.json` 增加测试脚本**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 2: 新增 Vitest 配置**

```ts
// admin-rsbuild/vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: 新增测试初始化文件**

```ts
// admin-rsbuild/src/test/setup.ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: 验证配置可用**

Run: `pnpm test:run -- --reporter=verbose 2>&1 | head -5`
Expected: 无报错，vitest 可正常启动（即使暂无测试文件也应正常退出）。

- [ ] **Step 5: 提交**

```bash
git add admin-rsbuild/package.json admin-rsbuild/vitest.config.ts admin-rsbuild/src/test/setup.ts
git commit -m "test(login): 搭建 Vitest 测试基线配置"
```

---

## Task 2: 迁移路由入口到登录目录

**Files:**
- Create: `admin-rsbuild/src/routes/login/index.tsx`
- Delete: `admin-rsbuild/src/routes/login.tsx`

- [ ] **Step 1: 创建 `login/index.tsx`，迁移现有路由逻辑**

保持 `ApiPassport.passwordLogin`、`setToken`、`redirect` 逻辑完全不变。新增 `activePanel` / `transitionState` 状态管理。

```tsx
// admin-rsbuild/src/routes/login/index.tsx
import { useState } from 'react';
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

export type PanelType = 'password' | 'qrScan' | 'skeleton';
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

  const [activePanel, setActivePanel] = useState<PanelType>('skeleton');
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');

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

  const switchPanel = (target: PanelType) => {
    if (transitionState !== 'idle') {
      return;
    }
    setTransitionState('exiting');
  };

  const handleTransitionEnd = () => {
    if (transitionState === 'exiting') {
      setActivePanel((prev) => {
        /** 切换到另一面板：skeleton → password，password ↔ qrScan */
        if (prev === 'skeleton') return 'password';
        if (prev === 'password') return 'qrScan';
        return 'password';
      });
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
```

- [ ] **Step 2: 删除旧路由文件**

Run: `rm admin-rsbuild/src/routes/login.tsx`

- [ ] **Step 3: 构建验证路由树自动更新**

Run: `pnpm build`
Expected: PASS，`routeTree.gen.ts` 导入更新为 `./routes/login/index`。

- [ ] **Step 4: 提交**

```bash
git add admin-rsbuild/src/routes/login/index.tsx admin-rsbuild/src/routeTree.gen.ts
git rm admin-rsbuild/src/routes/login.tsx
git commit -m "refactor(login): 路由入口迁移到 login 目录并增加面板切换状态"
```

---

## Task 3: 迁移样式文件到登录目录并调整为浅色科技风

**Files:**
- Create: `admin-rsbuild/src/routes/login/#login.styled.tsx`
- Create: `admin-rsbuild/src/routes/login/#login-form.styled.tsx`
- Delete: `admin-rsbuild/src/routes/#login.styled.tsx`
- Delete: `admin-rsbuild/src/routes/#login-form.styled.tsx`

- [ ] **Step 1: 迁移 `#login.styled.tsx` 并调整为浅色科技风**

从 `admin-rsbuild/src/routes/#login.styled.tsx` 迁移，将 CSS 变量从深色改为浅色主题。

```tsx
// admin-rsbuild/src/routes/login/#login.styled.tsx
import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

export const LoginViewport = styled.div`
  --login-bg: #f5f8ff;
  --login-bg-secondary: #edf2ff;
  --login-surface: rgba(255, 255, 255, 0.92);
  --login-surface-strong: rgba(255, 255, 255, 0.96);
  --login-border: rgba(59, 107, 255, 0.12);
  --login-border-strong: rgba(59, 107, 255, 0.28);
  --login-primary: #3b6bff;
  --login-secondary: #6c8cff;
  --login-text: #111a33;
  --login-text-secondary: #5a6b9a;
  --login-warning-bg: #fff4ec;
  --login-warning-border: #ffd4b8;
  --login-shadow: 0 24px 80px rgba(17, 26, 51, 0.08);

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 0 0, rgba(59, 107, 255, 0.08) 0%, transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(108, 140, 255, 0.06) 0%, transparent 30%),
    linear-gradient(135deg, var(--login-bg) 0%, var(--login-bg-secondary) 100%);
  color: var(--login-text);
  font-family:
    'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;

  ${motionReduce}
`;

export const SurfaceGlow = styled.div`
  position: absolute;
  top: -180px;
  left: -120px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(59, 107, 255, 0.12) 0%,
    rgba(59, 107, 255, 0.04) 34%,
    transparent 72%
  );
  filter: blur(14px);
  pointer-events: none;
`;

export const OrbitGlow = styled.div`
  position: absolute;
  right: 8%;
  bottom: -220px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(108, 140, 255, 0.1) 0%,
    rgba(108, 140, 255, 0.04) 36%,
    transparent 74%
  );
  filter: blur(18px);
  pointer-events: none;
`;

export const GridDecoration = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 107, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 107, 255, 0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.15) 50%,
    rgba(0, 0, 0, 0.55) 100%
  );
  pointer-events: none;
`;

export const PageShell = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 48px 56px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1199px) {
    padding: 40px 32px;
  }
`;

export const SectionGrid = styled.div`
  width: min(1320px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 520px);
  gap: 56px;
  align-items: stretch;

  @media (max-width: 1199px) {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 460px);
    gap: 32px;
  }
`;

export const HeroPanel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 48px 0;
  animation: ${fadeInUp} 0.72s ease-out both;

  ${motionReduce}
`;

export const BrandBlock = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  width: fit-content;
  border: 1px solid rgba(59, 107, 255, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(17, 26, 51, 0.06);
`;

export const BrandLogo = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

export const BrandCaption = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.22em;
  color: var(--login-text-secondary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const BrandTitle = styled.div`
  margin-top: 4px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
  color: var(--login-text);
`;

export const HeroEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.28em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const HeroTitle = styled.h1`
  margin: 0;
  max-width: 620px;
  font-size: 48px;
  line-height: 1.16;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-wrap: balance;

  @media (max-width: 1199px) {
    font-size: 40px;
  }
`;

export const HeroDescription = styled.p`
  margin: 0;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

export const CapabilityList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 620px;
`;

export const CapabilityChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(59, 107, 255, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: var(--login-text);
  font-size: 14px;
  line-height: 20px;
  backdrop-filter: blur(8px);
`;
```

- [ ] **Step 2: 迁移 `#login-form.styled.tsx` 并调整为浅色风格**

```tsx
// admin-rsbuild/src/routes/login/#login-form.styled.tsx
import { Button, Form } from 'antd';
import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

export const CardWrapper = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid var(--login-border);
  background: var(--login-surface);
  backdrop-filter: blur(22px);
  box-shadow: var(--login-shadow);
  animation: ${fadeInUp} 0.82s ease-out both;

  ${motionReduce}
`;

export const CardHeader = styled.div`
  margin-bottom: 26px;
`;

export const CardEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.24em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const CardTitle = styled.h2`
  margin: 12px 0 10px;
  font-size: 32px;
  line-height: 1.18;
  font-weight: 700;
  color: var(--login-text);
`;

export const CardDescription = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

export const StyledForm = styled(Form)`
  width: 100%;

  .ant-form-item {
    margin-bottom: 18px;
  }

  .ant-form-item-label {
    padding-bottom: 8px;
  }

  .ant-form-item-label > label {
    color: var(--login-text-secondary);
    font-size: 12px;
    line-height: 18px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-family:
      'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
      'Liberation Mono', monospace;
  }

  .ant-form-item-explain-error {
    margin-top: 6px;
    color: #d4380d;
    font-size: 13px;
  }

  .ant-input,
  .ant-input-affix-wrapper {
    min-height: 46px;
    padding: 10px 14px;
    color: var(--login-text);
    background: #ffffff;
    border: 1px solid rgba(17, 26, 51, 0.12);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .ant-input::placeholder,
  .ant-input-affix-wrapper input::placeholder {
    color: rgba(90, 107, 154, 0.6);
  }

  .ant-input-affix-wrapper .ant-input {
    min-height: auto;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .ant-input:hover,
  .ant-input-affix-wrapper:hover {
    border-color: var(--login-border-strong);
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper-focused,
  .ant-input-affix-wrapper:focus-within {
    border-color: var(--login-primary);
    box-shadow: 0 0 0 3px rgba(59, 107, 255, 0.1);
  }
`;

export const WarningBanner = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--login-warning-border);
  background: var(--login-warning-bg);
  color: #b54708;
  font-size: 14px;
  line-height: 1.6;
`;

export const StyledSubmitButton = styled(Button)`
  && {
    height: 46px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    background: var(--login-primary);
    box-shadow: 0 4px 12px rgba(59, 107, 255, 0.3);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  &&:hover,
  &&:focus {
    color: #ffffff;
    background: #5580ff;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 107, 255, 0.35);
  }

  &&:active {
    transform: translateY(0);
  }

  &&[disabled],
  &&[disabled]:hover {
    color: rgba(255, 255, 255, 0.72);
    background: #b4c4e0;
    transform: none;
    box-shadow: none;
  }

  ${motionReduce}
`;

export const FooterHint = styled.div`
  margin-top: 6px;
  color: var(--login-text-secondary);
  font-size: 13px;
  line-height: 1.8;
`;
```

- [ ] **Step 3: 删除旧样式文件**

Run: `rm admin-rsbuild/src/routes/#login.styled.tsx admin-rsbuild/src/routes/#login-form.styled.tsx`

- [ ] **Step 4: 提交**

```bash
git add admin-rsbuild/src/routes/login/#login.styled.tsx admin-rsbuild/src/routes/login/#login-form.styled.tsx
git rm admin-rsbuild/src/routes/#login.styled.tsx admin-rsbuild/src/routes/#login-form.styled.tsx
git commit -m "refactor(login): 迁移样式到 login 目录并调整为浅色科技风"
```

---

## Task 4: 创建霓虹灯动画与 panel 过渡样式

**Files:**
- Create: `admin-rsbuild/src/routes/login/#styles.tsx`

- [ ] **Step 1: 实现 `#styles.tsx`**

包含三组霓虹灯动画条的样式和 panel 淡入淡出过渡样式。

```tsx
// admin-rsbuild/src/routes/login/#styles.tsx
import styled, { keyframes, css } from 'styled-components';

const neonPulse = keyframes`
  0% {
    opacity: 0.4;
    transform: scaleX(0.6);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
  100% {
    opacity: 0.4;
    transform: scaleX(0.6);
  }
`;

const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

export const NeonSidebar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 40px 0;
  pointer-events: none;
`;

export const NeonBar = styled.div<{ $delay: number; $color: string }>`
  flex: 1;
  border-radius: 3px;
  background: ${(props) => props.$color};
  box-shadow: 0 0 16px ${(props) => props.$color}, 0 0 32px ${(props) => props.$color};
  animation: ${neonPulse} 3s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
  transform-origin: center;

  ${motionReduce}
`;

export const PanelTransition = styled.div<{ $state: 'idle' | 'exiting' | 'entering' }>`
  opacity: ${(props) => {
    if (props.$state === 'exiting') return 0;
    if (props.$state === 'entering') return 1;
    return 1;
  }};
  transition: opacity 300ms ease;
`;

export const AnimationContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;
```

- [ ] **Step 2: 提交**

```bash
git add admin-rsbuild/src/routes/login/#styles.tsx
git commit -m "feat(login): 添加霓虹灯动画与 panel 过渡样式"
```

---

## Task 5: 创建霓虹灯动画组件与背景包装层

**Files:**
- Create: `admin-rsbuild/src/routes/login/#Login-NeonAnimation.tsx`
- Create: `admin-rsbuild/src/routes/login/#Login-Background.tsx`

- [ ] **Step 1: 实现 `#Login-NeonAnimation.tsx`**

```tsx
// admin-rsbuild/src/routes/login/#Login-NeonAnimation.tsx
import { NeonBar, NeonSidebar } from './#styles';

const NEON_COLORS = ['#3b6bff', '#6ce6ff', '#a78bfa'];

/** 左侧栏三组错开 delay 的霓虹灯动画条 */
function LoginNeonAnimation() {
  return (
    <NeonSidebar aria-hidden="true">
      {NEON_COLORS.map((color, index) => {
        return (
          <NeonBar
            key={color}
            $color={color}
            $delay={index * 0.8}
          />
        );
      })}
    </NeonSidebar>
  );
}

export default LoginNeonAnimation;
```

- [ ] **Step 2: 实现 `#Login-Background.tsx`**

```tsx
// admin-rsbuild/src/routes/login/#Login-Background.tsx
import type { ReactNode } from 'react';

import {
  GridDecoration,
  OrbitGlow,
  PageShell,
  SectionGrid,
  SurfaceGlow,
} from './#login.styled';
import { LoginViewport } from './#login.styled';
import LoginNeonAnimation from './#Login-NeonAnimation';
import type { TransitionState } from './index';

interface LoginBackgroundProps {
  heroPanel: ReactNode;
  children: ReactNode;
  transitionState: TransitionState;
  onTransitionEnd: () => void;
}

/** 背景包装层：左侧品牌区 + 右侧动画容器 + children slot 插入当前 panel */
function LoginBackground(props: LoginBackgroundProps) {
  return (
    <LoginViewport>
      <SurfaceGlow aria-hidden="true" />
      <OrbitGlow aria-hidden="true" />
      <GridDecoration aria-hidden="true" />
      <PageShell>
        <SectionGrid>
          {props.heroPanel}
          <div
            onTransitionEnd={props.onTransitionEnd}
            style={{
              opacity: props.transitionState === 'exiting' ? 0 : 1,
              transition: 'opacity 300ms ease',
            }}
          >
            <LoginNeonAnimation />
            {props.children}
          </div>
        </SectionGrid>
      </PageShell>
    </LoginViewport>
  );
}

export default LoginBackground;
```

- [ ] **Step 3: 提交**

```bash
git add admin-rsbuild/src/routes/login/#Login-NeonAnimation.tsx admin-rsbuild/src/routes/login/#Login-Background.tsx
git commit -m "feat(login): 实现霓虹灯动画组件与背景包装层"
```

---

## Task 6: 创建密码登录主卡片组件

**Files:**
- Create: `admin-rsbuild/src/routes/login/#LoginMainCard.tsx`
- Create: `admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx`

- [ ] **Step 1: 先写主卡片失败用例**

```tsx
// admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx
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
```

- [ ] **Step 2: 运行用例确认先失败**

Run: `pnpm test:run -- src/routes/login/__tests__/LoginMainCard.test.tsx`
Expected: FAIL，提示 `#LoginMainCard` 不存在。

- [ ] **Step 3: 实现主卡片组件**

```tsx
// admin-rsbuild/src/routes/login/#LoginMainCard.tsx
import { Form, Input } from 'antd';

import {
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
  CardWrapper,
  StyledForm,
  StyledSubmitButton,
  WarningBanner,
} from './#login-form.styled';

export interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginMainCardProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onOpenRegister: () => void;
  onOpenForgot: () => void;
  onSwitchToQR: () => void;
}

/** 登录主卡片只负责输入与入口触发，不负责 token 持久化与路由跳转 */
function LoginMainCard(props: LoginMainCardProps) {
  return (
    <CardWrapper>
      <CardHeader>
        <CardEyebrow>AUTHENTICATION</CardEyebrow>
        <CardTitle>登录后台</CardTitle>
        <CardDescription>
          请输入管理员账号与密码，进入当前租户的项目管理工作区。
        </CardDescription>
      </CardHeader>

      <StyledForm
        layout="vertical"
        requiredMark={false}
        colon={false}
        onFinish={props.onSubmit}
      >
        {props.errorMessage && (
          <WarningBanner role="alert">{props.errorMessage}</WarningBanner>
        )}

        <Form.Item
          label="登录账号"
          name="username"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input
            size="large"
            placeholder="请输入登录账号"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="登录密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            size="large"
            placeholder="请输入登录密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <button type="button" onClick={props.onOpenForgot}>
            忘记密码
          </button>
          <button type="button" onClick={props.onOpenRegister}>
            没有账号？立即注册
          </button>
        </div>

        <Form.Item>
          <StyledSubmitButton
            type="primary"
            htmlType="submit"
            loading={props.loading}
            block
          >
            确认登录
          </StyledSubmitButton>
        </Form.Item>
      </StyledForm>
    </CardWrapper>
  );
}

export default LoginMainCard;
```

- [ ] **Step 4: 运行测试并提交**

Run: `pnpm test:run -- src/routes/login/__tests__/LoginMainCard.test.tsx`
Expected: PASS，3 个用例通过。

```bash
git add admin-rsbuild/src/routes/login/#LoginMainCard.tsx admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx
git commit -m "feat(login): 拆分登录主卡片并补充交互测试"
```

---

## Task 7: 创建 QR 扫描面板与骨架屏面板

**Files:**
- Create: `admin-rsbuild/src/routes/login/#Login-QRScan.tsx`
- Create: `admin-rsbuild/src/routes/login/#Login-Skeleton.tsx`

- [ ] **Step 1: 实现 `#Login-QRScan.tsx`**

由于当前后端没有 QR 登录接口，使用 mock 实现。`useQuery` + `refetchInterval` 轮询机制已就绪，后续接入真实接口时替换 `queryFn` 即可。

```tsx
// admin-rsbuild/src/routes/login/#Login-QRScan.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
  CardWrapper,
} from './#login-form.styled';

interface LoginQRScanProps {
  onSwitchToPassword: () => void;
  onLoginSuccess: () => void;
}

const QR_TIMEOUT_MS = 60_000;

/** Mock: 模拟获取 QR 码 */
async function fetchQRCode(): Promise<{ qrUrl: string; token: string }> {
  return {
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-login-${Date.now()}`,
    token: `qr-token-${Date.now()}`,
  };
}

/** Mock: 模拟轮询扫描状态 */
async function checkQRStatus(_token: string): Promise<{ scanned: boolean }> {
  return { scanned: false };
}

/** QR 扫描登录面板：展示二维码 + 轮询扫描状态 + 超时处理 */
function LoginQRScan(props: LoginQRScanProps) {
  const [expired, setExpired] = useState(false);
  const [startTime] = useState(() => Date.now());

  const qrQuery = useQuery({
    queryKey: ['login-qr-code'],
    queryFn: fetchQRCode,
    refetchInterval: (query) => {
      if (query.state.data?.scanned) {
        return false;
      }
      if (Date.now() - startTime > QR_TIMEOUT_MS) {
        setExpired(true);
        return false;
      }
      return 3000;
    },
    retry: 0,
  });

  const statusQuery = useQuery({
    queryKey: ['login-qr-status', qrQuery.data?.token],
    queryFn: () => checkQRStatus(qrQuery.data!.token),
    enabled: !!qrQuery.data?.token && !expired,
    refetchInterval: 3000,
  });

  if (statusQuery.data?.scanned) {
    props.onLoginSuccess();
  }

  return (
    <CardWrapper>
      <CardHeader>
        <CardEyebrow>QR SCAN</CardEyebrow>
        <CardTitle>扫码登录</CardTitle>
        <CardDescription>
          请使用移动端 App 扫描下方二维码完成登录。
        </CardDescription>
      </CardHeader>

      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        {expired && (
          <div>
            <p>二维码已过期</p>
            <button
              type="button"
              onClick={() => {
                setExpired(false);
                qrQuery.refetch();
              }}
            >
              重新生成
            </button>
          </div>
        )}

        {!expired && qrQuery.data && (
          <img
            src={qrQuery.data.qrUrl}
            alt="登录二维码"
            width={200}
            height={200}
          />
        )}

        {!expired && qrQuery.isLoading && <p>加载二维码中...</p>}

        {qrQuery.isError && (
          <div>
            <p>加载失败</p>
            <button type="button" onClick={() => qrQuery.refetch()}>
              重试
            </button>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={props.onSwitchToPassword}>
          返回密码登录
        </button>
      </div>
    </CardWrapper>
  );
}

export default LoginQRScan;
```

- [ ] **Step 2: 实现 `#Login-Skeleton.tsx`**

骨架屏模拟密码表单布局，给用户"页面就绪"感。

```tsx
// admin-rsbuild/src/routes/login/#Login-Skeleton.tsx
import { useEffect } from 'react';
import { Skeleton } from 'antd';

import { CardWrapper, CardHeader } from './#login-form.styled';

interface LoginSkeletonProps {
  onReady: () => void;
}

/** 过渡骨架屏：模拟密码表单布局，加载完成后通知切换 */
function LoginSkeleton(props: LoginSkeletonProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      props.onReady();
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [props.onReady]);

  return (
    <CardWrapper>
      <CardHeader>
        <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 12 }} />
        <Skeleton.Input active size="default" style={{ width: 180, marginBottom: 10 }} />
        <Skeleton.Input active size="small" style={{ width: 300 }} />
      </CardHeader>

      <div style={{ marginBottom: 18 }}>
        <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
        <Skeleton.Input active block size="large" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
        <Skeleton.Input active block size="large" />
      </div>

      <Skeleton.Button active block size="large" style={{ height: 46 }} />
    </CardWrapper>
  );
}

export default LoginSkeleton;
```

- [ ] **Step 3: 提交**

```bash
git add admin-rsbuild/src/routes/login/#Login-QRScan.tsx admin-rsbuild/src/routes/login/#Login-Skeleton.tsx
git commit -m "feat(login): 实现 QR 扫描面板与骨架屏过渡面板"
```

---

## Task 8: 创建注册与找回密码弹窗

**Files:**
- Create: `admin-rsbuild/src/routes/login/#Login-RegisterModal.tsx`
- Create: `admin-rsbuild/src/routes/login/#Login-ForgotPasswordModal.tsx`

- [ ] **Step 1: 实现 `#Login-RegisterModal.tsx`**

使用 Ant Design `Modal` + `Form`，仅做本地校验与反馈，不接后端。

```tsx
// admin-rsbuild/src/routes/login/#Login-RegisterModal.tsx
import { Form, Input, Modal, message } from 'antd';

interface RegisterFormValues {
  nickname: string;
  username: string;
  mobile: string;
}

interface LoginRegisterModalProps {
  open: boolean;
  onClose: () => void;
}

/** 注册弹窗仅提供展示级表单交互，不发起真实注册请求 */
function LoginRegisterModal(props: LoginRegisterModalProps) {
  const [form] = Form.useForm<RegisterFormValues>();

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('注册成功（展示级）');
      form.resetFields();
      props.onClose();
    } catch {
      /** 校验失败，不关闭弹窗 */
    }
  };

  const handleCancel = () => {
    form.resetFields();
    props.onClose();
  };

  return (
    <Modal
      title="注册账号"
      open={props.open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="注册"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="nickname"
          label="名字"
          rules={[{ required: true, message: '请输入名字' }]}
        >
          <Input placeholder="请输入名字" autoFocus />
        </Form.Item>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item
          name="mobile"
          label="手机号"
          rules={[{ required: true, message: '请输入手机号' }]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default LoginRegisterModal;
```

- [ ] **Step 2: 实现 `#Login-ForgotPasswordModal.tsx`**

```tsx
// admin-rsbuild/src/routes/login/#Login-ForgotPasswordModal.tsx
import { Form, Input, Modal, message } from 'antd';

interface ForgotFormValues {
  username: string;
  mobile: string;
}

interface LoginForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/** 找回密码弹窗仅提供展示级表单交互，不发起真实请求 */
function LoginForgotPasswordModal(props: LoginForgotPasswordModalProps) {
  const [form] = Form.useForm<ForgotFormValues>();

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('重置链接已发送（展示级）');
      form.resetFields();
      props.onClose();
    } catch {
      /** 校验失败，不关闭弹窗 */
    }
  };

  const handleCancel = () => {
    form.resetFields();
    props.onClose();
  };

  return (
    <Modal
      title="找回密码"
      open={props.open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="提交"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" autoFocus />
        </Form.Item>
        <Form.Item
          name="mobile"
          label="手机号"
          rules={[{ required: true, message: '请输入手机号' }]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default LoginForgotPasswordModal;
```

- [ ] **Step 3: 提交**

```bash
git add admin-rsbuild/src/routes/login/#Login-RegisterModal.tsx admin-rsbuild/src/routes/login/#Login-ForgotPasswordModal.tsx
git commit -m "feat(login): 实现注册与找回密码弹窗（展示级）"
```

---

## Task 9: 组装页面编排组件

**Files:**
- Create: `admin-rsbuild/src/routes/login/#LoginPage.tsx`
- Delete: `admin-rsbuild/src/routes/#LoginPage.tsx`

- [ ] **Step 1: 实现 `#LoginPage.tsx`**

页面编排组件：渲染品牌区 + 背景层 + 按需挂载当前 panel + 弹窗绑定。

```tsx
// admin-rsbuild/src/routes/login/#LoginPage.tsx
import { useCallback, useState } from 'react';

import logo from '@/assets/svg/logo.svg';

import {
  BrandBlock,
  BrandCaption,
  BrandLogo,
  BrandTitle,
  CapabilityChip,
  CapabilityList,
  HeroDescription,
  HeroEyebrow,
  HeroPanel,
  HeroTitle,
} from './#login.styled';
import LoginBackground from './#Login-Background';
import LoginMainCard, { type LoginFormValues } from './#LoginMainCard';
import LoginQRScan from './#Login-QRScan';
import LoginSkeleton from './#Login-Skeleton';
import LoginRegisterModal from './#Login-RegisterModal';
import LoginForgotPasswordModal from './#Login-ForgotPasswordModal';
import type { PanelType, TransitionState } from './index';

interface LoginPageProps {
  activePanel: PanelType;
  transitionState: TransitionState;
  loading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onSwitchPanel: (target: PanelType) => void;
  onTransitionEnd: () => void;
  onSkeletonReady: () => void;
}

const CAPABILITY_LIST = ['多租户隔离', '权限安全接入', '模型与项目协作'];

/** 登录页面编排：品牌区 + 背景层 + 当前 panel + 弹窗 */
function LoginPage(props: LoginPageProps) {
  const brandTitle = process.env.TITLE || '项目管理工具';

  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleOpenRegister = useCallback(() => {
    setRegisterOpen(true);
  }, []);

  const handleOpenForgot = useCallback(() => {
    setForgotPasswordOpen(true);
  }, []);

  const heroPanel = (
    <HeroPanel>
      <BrandBlock>
        <BrandLogo src={logo} alt="系统标志" />
        <div>
          <BrandCaption>MODEL CONTROL CENTER</BrandCaption>
          <BrandTitle>{brandTitle}</BrandTitle>
        </div>
      </BrandBlock>
      <HeroEyebrow>SECURE ACCESS</HeroEyebrow>
      <HeroTitle>面向多租户场景的项目管理工具</HeroTitle>
      <HeroDescription>
        多租户模型设计与协作控制台
        <br />
        统一管理权限、模型资产与项目协同流程。
      </HeroDescription>
      <CapabilityList>
        {CAPABILITY_LIST.map((item) => {
          return <CapabilityChip key={item}>{item}</CapabilityChip>;
        })}
      </CapabilityList>
    </HeroPanel>
  );

  /** 根据 activePanel 渲染当前面板 */
  const renderPanel = () => {
    if (props.activePanel === 'skeleton') {
      return <LoginSkeleton onReady={props.onSkeletonReady} />;
    }

    if (props.activePanel === 'qrScan') {
      return (
        <LoginQRScan
          onSwitchToPassword={() => {
            props.onSwitchPanel('password');
          }}
          onLoginSuccess={() => {
            props.onSwitchPanel('skeleton');
          }}
        />
      );
    }

    return (
      <LoginMainCard
        loading={props.loading}
        errorMessage={props.errorMessage}
        onSubmit={props.onSubmit}
        onOpenRegister={handleOpenRegister}
        onOpenForgot={handleOpenForgot}
        onSwitchToQR={() => {
          props.onSwitchPanel('qrScan');
        }}
      />
    );
  };

  return (
    <>
      <LoginBackground
        heroPanel={heroPanel}
        transitionState={props.transitionState}
        onTransitionEnd={props.onTransitionEnd}
      >
        {renderPanel()}
      </LoginBackground>

      <LoginRegisterModal
        open={registerOpen}
        onClose={() => {
          setRegisterOpen(false);
        }}
      />

      <LoginForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false);
        }}
      />
    </>
  );
}

export default LoginPage;
```

- [ ] **Step 2: 删除旧页面组件**

Run: `rm admin-rsbuild/src/routes/#LoginPage.tsx`

- [ ] **Step 3: 构建验证**

Run: `pnpm build`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add admin-rsbuild/src/routes/login/#LoginPage.tsx
git rm admin-rsbuild/src/routes/#LoginPage.tsx
git commit -m "feat(login): 组装登录页面编排并清理旧页面组件"
```

---

## Task 10: 回归验证与交付核查

**Files:**
- Review only: 本次所有改动文件

- [ ] **Step 1: 运行全部测试**

Run: `pnpm test:run`
Expected: PASS，LoginMainCard 3 个用例通过。

- [ ] **Step 2: 运行构建**

Run: `pnpm build`
Expected: PASS，`routeTree.gen.ts` 导入正确指向 `./routes/login/index`。

- [ ] **Step 3: 对照 spec 逐条核查范围**

Run: `rg -n "ApiPassport\.passwordLogin|setToken\(" admin-rsbuild/src/routes/login`
Expected: 仅在 `index.tsx` 中存在登录接口调用。

Run: `rg -n "Modal\.(error|success)" admin-rsbuild/src/routes/login`
Expected: `index.tsx` 中 `Modal.error` 处理登录失败；弹窗组件中 `message.success` 处理展示级反馈。

- [ ] **Step 4: 约束扫描**

Run: `rg -n "\?.*:" admin-rsbuild/src/routes/login`
Expected: 无业务新增三元表达式命中。

Run: `wc -l admin-rsbuild/src/routes/login/*.tsx admin-rsbuild/src/routes/login/*.ts`
Expected: 单文件行数可控，不超过 400 行。

- [ ] **Step 5: 确认无残留旧文件**

Run: `ls admin-rsbuild/src/routes/#login* admin-rsbuild/src/routes/login.tsx 2>&1`
Expected: `No such file or directory`（旧文件已全部清理）。

- [ ] **Step 6: 最终提交**

```bash
git add admin-rsbuild
git commit -m "chore(login): 完成登录页重构交付核查"
```

---

## Spec 覆盖映射

- 登录主页面按 `login.pen` 重构：Task 3、Task 6、Task 9
- 密码登录/QR扫描/骨架屏三面板：Task 6、Task 7
- CSS 过渡动画切换机制：Task 2（状态定义）、Task 5（背景层过渡）、Task 9（编排）
- 霓虹灯动画侧栏：Task 4、Task 5
- 注册/找回弹窗展示交互：Task 8
- 接口逻辑不变：Task 2、Task 10
- 文件集中到登录目录：Task 2、Task 3、Task 9
- 测试：Task 1、Task 6

## 计划自检

- **Spec 覆盖**：已覆盖设计文档全部 8 个子组件、canvas 切换机制、数据流、视觉风格要求。
- **占位词检查**：全文无 `TODO`、`TBD`、`后续补充` 等占位描述。
- **一致性检查**：统一使用 `PanelType`/`TransitionState` 类型、`LoginFormValues` 接口、`#` 前缀文件命名。
- **范围检查**：仅涉及前端登录目录与测试基建，不包含后端接口扩展。QR 面板使用 mock 实现，后续替换 `queryFn` 即可接入真实接口。
