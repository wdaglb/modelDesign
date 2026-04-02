# 登录页画布重构（login.pen）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有登录接口逻辑的前提下，按 `ui/login.pen` 重构 `/login` 页面，并落地注册/找回密码展示级弹窗交互。

**Architecture:** 路由入口保持 `ApiPassport.passwordLogin`、`setToken` 和 `redirect` 跳转逻辑，仅把登录相关文件收敛到 `src/routes/login/`。页面交互采用“主登录卡片 + KModal 弹窗服务”模式，注册/找回只做本地校验与反馈，不新增后端调用。通过 Vitest + Testing Library 补充最小可维护测试集，覆盖登录路由辅助函数、主表单提交行为与弹窗打开链路。

**Tech Stack:** React 18、TypeScript、TanStack Router、TanStack Query、Ant Design v6、styled-components、KModal、Vitest、Testing Library

---

> 实施前置确认：Task 1 会新增前端测试依赖（`vitest`、`@testing-library/react`、`@testing-library/user-event`、`jsdom`）。执行该任务前必须按仓库约束先征得用户确认。

## 文件结构与职责

### 新增文件

- `admin-rsbuild/vitest.config.ts`
  - Vitest 运行配置（jsdom、别名、setup）。
- `admin-rsbuild/src/test/setup.ts`
  - 测试通用初始化（清理 DOM、基础 mock）。
- `admin-rsbuild/src/routes/login/index.tsx`
  - 登录路由入口，承接旧 `login.tsx` 的接口逻辑。
- `admin-rsbuild/src/routes/login/#loginRouteHelper.ts`
  - 路由层纯函数辅助（错误提取、成功跳转执行）。
- `admin-rsbuild/src/routes/login/#loginModalService.tsx`
  - 注册/找回弹窗打开服务，封装 `useKModal().open` 调用。
- `admin-rsbuild/src/routes/login/#LoginMainCard.tsx`
  - 登录主卡片（账号/密码、错误提示、入口按钮）。
- `admin-rsbuild/src/routes/login/#RegisterModal.tsx`
  - 注册弹窗内容（`KModal.Form`）。
- `admin-rsbuild/src/routes/login/#ForgotModal.tsx`
  - 找回密码弹窗内容（`KModal.Form`）。
- `admin-rsbuild/src/routes/login/#LoginPage.tsx`
  - 登录页面编排（品牌区 + 主卡片 + 弹窗入口绑定）。
- `admin-rsbuild/src/routes/login/#login.styled.tsx`
  - 页面整体与品牌区样式（浅色科技风）。
- `admin-rsbuild/src/routes/login/#login-form.styled.tsx`
  - 登录卡片与表单样式。
- `admin-rsbuild/src/routes/login/__tests__/loginRouteHelper.test.ts`
  - 路由辅助函数单测。
- `admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx`
  - 主登录卡片交互测试。
- `admin-rsbuild/src/routes/login/__tests__/loginModalService.test.tsx`
  - 弹窗服务调用测试。

### 修改文件

- `admin-rsbuild/package.json`
  - 增加测试脚本与测试依赖。
- `admin-rsbuild/src/routeTree.gen.ts`
  - 路由插件自动更新，不手改。

### 删除文件

- `admin-rsbuild/src/routes/login.tsx`
- `admin-rsbuild/src/routes/#LoginPage.tsx`
- `admin-rsbuild/src/routes/#login.styled.tsx`
- `admin-rsbuild/src/routes/#login-form.styled.tsx`
- `admin-rsbuild/src/routes/login.module.less`（若最终确认未被引用）

## Task 1: 搭建测试基线并锁定登录路由纯函数（TDD）

**Files:**
- Modify: `admin-rsbuild/package.json`
- Create: `admin-rsbuild/vitest.config.ts`
- Create: `admin-rsbuild/src/test/setup.ts`
- Create: `admin-rsbuild/src/routes/login/__tests__/loginRouteHelper.test.ts`
- Create: `admin-rsbuild/src/routes/login/#loginRouteHelper.ts`

- [ ] **Step 1: 先确认新增测试依赖执行权限（用户确认后再执行安装）**

Run: `pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom`  
Expected: `dependencies` 与 `pnpm-lock.yaml` 更新成功。

- [ ] **Step 2: 在 `package.json` 增加测试脚本（先写脚本，后续命令可复用）**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 3: 新增 Vitest 配置与初始化文件**

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

```ts
// admin-rsbuild/src/test/setup.ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * 每个测试结束后清理挂载节点，避免跨用例污染。
 */
afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: 先写失败用例，约束错误消息与登录成功回调行为**

```ts
// admin-rsbuild/src/routes/login/__tests__/loginRouteHelper.test.ts
import { describe, expect, it, vi } from 'vitest';
import {
  getLoginErrorMessage,
  handleLoginSuccess,
} from '../#loginRouteHelper';

describe('loginRouteHelper', () => {
  it('在请求失败时返回错误信息', () => {
    const message = getLoginErrorMessage(true, new Error('账号或密码错误'));
    expect(message).toBe('账号或密码错误');
  });

  it('在非错误状态下返回 undefined', () => {
    const message = getLoginErrorMessage(false, new Error('ignored'));
    expect(message).toBeUndefined();
  });

  it('登录成功后写入 token 并跳转', () => {
    const setToken = vi.fn();
    const navigate = vi.fn();

    handleLoginSuccess({
      token: 'token-1',
      redirect: '/project',
      setToken,
      navigate,
    });

    expect(setToken).toHaveBeenCalledWith('token-1');
    expect(navigate).toHaveBeenCalledWith({ to: '/project', replace: true });
  });
});
```

- [ ] **Step 5: 运行单测确认先失败（模块尚不存在）**

Run: `pnpm test:run -- src/routes/login/__tests__/loginRouteHelper.test.ts`  
Expected: FAIL，报错 `Cannot find module '../#loginRouteHelper'`。

- [ ] **Step 6: 实现最小通过代码并补充 `/** */` 注释**

```ts
// admin-rsbuild/src/routes/login/#loginRouteHelper.ts
interface LoginSuccessContext {
  token: string;
  redirect: string;
  setToken: (token: string) => void;
  navigate: (options: { to: string; replace: boolean }) => void;
}

/**
 * 统一提取登录错误信息，避免路由组件内重复分支判断。
 */
export function getLoginErrorMessage(
  isError: boolean,
  error?: Error,
): string | undefined {
  if (!isError) {
    return undefined;
  }

  if (!error) {
    return '登录失败，请稍后重试';
  }

  return error.message;
}

/**
 * 统一处理登录成功后的 token 持久化与页面跳转。
 */
export function handleLoginSuccess(context: LoginSuccessContext) {
  context.setToken(context.token);
  context.navigate({ to: context.redirect, replace: true });
}
```

- [ ] **Step 7: 再跑单测并提交**

Run: `pnpm test:run -- src/routes/login/__tests__/loginRouteHelper.test.ts`  
Expected: PASS，3 个用例全部通过。

```bash
git add admin-rsbuild/package.json admin-rsbuild/pnpm-lock.yaml admin-rsbuild/vitest.config.ts admin-rsbuild/src/test/setup.ts admin-rsbuild/src/routes/login/__tests__/loginRouteHelper.test.ts admin-rsbuild/src/routes/login/#loginRouteHelper.ts
git commit -m "test(login): 建立测试基线并补充路由辅助函数单测"
```

## Task 2: 路由目录迁移并保持接口链路不变

**Files:**
- Create: `admin-rsbuild/src/routes/login/index.tsx`
- Delete: `admin-rsbuild/src/routes/login.tsx`
- Modify: `admin-rsbuild/src/routeTree.gen.ts`（自动生成）

- [ ] **Step 1: 迁移路由入口到 `src/routes/login/index.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiPassport } from '@/api';
import useAuthStore from '@/store/auth.ts';
import LoginPage, { type LoginFormValues } from './#LoginPage';
import { getLoginErrorMessage, handleLoginSuccess } from './#loginRouteHelper';

const searchSchema = z.object({
  redirect: z.string().optional().default('/'),
});

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

  const mutation = useMutation({
    mutationFn: ApiPassport.passwordLogin,
    onSuccess: (data) => {
      handleLoginSuccess({
        token: data.token,
        redirect: search.redirect,
        setToken,
        navigate,
      });
    },
  });

  const errorMessage = getLoginErrorMessage(mutation.isError, mutation.error);

  return (
    <LoginPage
      loading={mutation.isPending}
      errorMessage={errorMessage}
      onSubmit={(values: LoginFormValues) => {
        return mutation.mutateAsync(values);
      }}
    />
  );
}
```

- [ ] **Step 2: 删除旧路由文件并触发路由树自动更新**

Run: `pnpm build`  
Expected: PASS，`routeTree.gen.ts` 导入更新为 `./routes/login/index`。

- [ ] **Step 3: 提交迁移变更**

```bash
git add admin-rsbuild/src/routes/login/index.tsx admin-rsbuild/src/routeTree.gen.ts
git rm admin-rsbuild/src/routes/login.tsx
git commit -m "refactor(login): 路由入口迁移到登录目录并保持登录链路不变"
```

## Task 3: 主登录卡片组件化并以测试锁定交互

**Files:**
- Create: `admin-rsbuild/src/routes/login/#LoginMainCard.tsx`
- Create: `admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx`
- Modify: `admin-rsbuild/src/routes/login/#LoginPage.tsx`

- [ ] **Step 1: 先写主卡片失败用例（必填校验 + 入口点击）**

```tsx
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
      />,
    );

    await user.click(screen.getByRole('button', { name: '确认登录' }));

    expect(await screen.findByText('请输入账号')).toBeDefined();
    expect(await screen.findByText('请输入密码')).toBeDefined();
  });

  it('点击入口能触发注册与找回回调', async () => {
    const user = userEvent.setup();
    const onOpenRegister = vi.fn();
    const onOpenForgot = vi.fn();

    render(
      <LoginMainCard
        loading={false}
        onSubmit={vi.fn()}
        onOpenRegister={onOpenRegister}
        onOpenForgot={onOpenForgot}
      />,
    );

    await user.click(screen.getByText('没有账号？立即注册'));
    await user.click(screen.getByText('忘记密码'));

    expect(onOpenRegister).toHaveBeenCalledTimes(1);
    expect(onOpenForgot).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行用例确认先失败**

Run: `pnpm test:run -- src/routes/login/__tests__/LoginMainCard.test.tsx`  
Expected: FAIL，提示 `#LoginMainCard` 不存在。

- [ ] **Step 3: 实现主卡片组件（仅承载表单与入口，不触碰接口）**

```tsx
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
import type { LoginFormValues } from './#LoginPage';

interface LoginMainCardProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onOpenRegister: () => void;
  onOpenForgot: () => void;
}

/**
 * 登录主卡片只负责输入与入口触发，不负责 token 持久化与路由跳转。
 */
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

      <StyledForm layout={'vertical'} requiredMark={false} onFinish={props.onSubmit}>
        <WarningBanner role={'alert'} hidden={!props.errorMessage}>
          {props.errorMessage}
        </WarningBanner>

        <Form.Item
          label={'登录账号'}
          name={'username'}
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input size={'large'} placeholder={'请输入登录账号'} autoComplete={'username'} />
        </Form.Item>

        <Form.Item
          label={'登录密码'}
          name={'password'}
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            size={'large'}
            placeholder={'请输入登录密码'}
            autoComplete={'current-password'}
          />
        </Form.Item>

        <div className={'login-entry-row'}>
          <button type={'button'} onClick={props.onOpenForgot}>
            忘记密码
          </button>
          <button type={'button'} onClick={props.onOpenRegister}>
            没有账号？立即注册
          </button>
        </div>

        <Form.Item>
          <StyledSubmitButton type={'primary'} htmlType={'submit'} loading={props.loading} block>
            确认登录
          </StyledSubmitButton>
        </Form.Item>
      </StyledForm>
    </CardWrapper>
  );
}

export default LoginMainCard;
```

- [ ] **Step 4: 在 `#LoginPage.tsx` 接入主卡片并保留 `LoginFormValues` 导出**

```tsx
export interface LoginFormValues {
  username: string;
  password: string;
}
```

- [ ] **Step 5: 运行主卡片测试并提交**

Run: `pnpm test:run -- src/routes/login/__tests__/LoginMainCard.test.tsx`  
Expected: PASS，2 个用例通过。

```bash
git add admin-rsbuild/src/routes/login/#LoginMainCard.tsx admin-rsbuild/src/routes/login/#LoginPage.tsx admin-rsbuild/src/routes/login/__tests__/LoginMainCard.test.tsx
git commit -m "feat(login): 拆分登录主卡片并补充交互测试"
```

## Task 4: 用 KModal 服务落地注册/找回弹窗（TDD）

**Files:**
- Create: `admin-rsbuild/src/routes/login/#loginModalService.tsx`
- Create: `admin-rsbuild/src/routes/login/#RegisterModal.tsx`
- Create: `admin-rsbuild/src/routes/login/#ForgotModal.tsx`
- Create: `admin-rsbuild/src/routes/login/__tests__/loginModalService.test.tsx`
- Modify: `admin-rsbuild/src/routes/login/#LoginPage.tsx`

- [ ] **Step 1: 先写失败用例，约束弹窗标题与关闭语义**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { openForgotModal, openRegisterModal } from '../#loginModalService';

describe('loginModalService', () => {
  it('打开注册弹窗时传入正确标题', async () => {
    const modal = { open: vi.fn().mockResolvedValue(undefined) };
    await openRegisterModal(modal);
    expect(modal.open).toHaveBeenCalledWith(
      expect.objectContaining({ title: '注册账号' }),
    );
  });

  it('用户取消找回弹窗时返回 false', async () => {
    const modal = { open: vi.fn().mockRejectedValue('KModal cancel') };
    const result = await openForgotModal(modal);
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: 运行用例确认先失败**

Run: `pnpm test:run -- src/routes/login/__tests__/loginModalService.test.tsx`  
Expected: FAIL，提示 `#loginModalService` 不存在。

- [ ] **Step 3: 实现弹窗服务与弹窗内容组件**

```tsx
// admin-rsbuild/src/routes/login/#loginModalService.tsx
import type { OpenProps } from '@/components/KModal/types.ts';
import ForgotModal from './#ForgotModal';
import RegisterModal from './#RegisterModal';

interface KModalInstance {
  open<T = any>(props: OpenProps): Promise<T>;
}

/**
 * 打开注册弹窗，取消时返回 false。
 */
export async function openRegisterModal(modal: KModalInstance) {
  try {
    await modal.open({
      title: '注册账号',
      width: 560,
      children: <RegisterModal />,
    });
    return true;
  } catch (error) {
    if (error === 'KModal cancel') {
      return false;
    }
    throw error;
  }
}

/**
 * 打开找回密码弹窗，取消时返回 false。
 */
export async function openForgotModal(modal: KModalInstance) {
  try {
    await modal.open({
      title: '找回密码',
      width: 560,
      children: <ForgotModal />,
    });
    return true;
  } catch (error) {
    if (error === 'KModal cancel') {
      return false;
    }
    throw error;
  }
}
```

```tsx
// admin-rsbuild/src/routes/login/#RegisterModal.tsx
import { Form, Input } from 'antd';
import KModal from '@/components/KModal';

interface RegisterFormValues {
  nickname: string;
  username: string;
  mobile: string;
}

/**
 * 注册弹窗仅提供展示级表单交互，不发起真实注册请求。
 */
function RegisterModal() {
  const [form] = Form.useForm<RegisterFormValues>();

  return (
    <KModal.Form form={form} layout={'vertical'} onFinish={async () => true}>
      <Form.Item name={'nickname'} label={'名字'} rules={[{ required: true, message: '请输入名字' }]}>
        <Input placeholder={'请输入名字'} autoFocus />
      </Form.Item>
      <Form.Item name={'username'} label={'用户名'} rules={[{ required: true, message: '请输入用户名' }]}>
        <Input placeholder={'请输入用户名'} />
      </Form.Item>
      <Form.Item name={'mobile'} label={'手机号'} rules={[{ required: true, message: '请输入手机号' }]}>
        <Input placeholder={'请输入手机号'} />
      </Form.Item>
    </KModal.Form>
  );
}

export default RegisterModal;
```

- [ ] **Step 4: 在 `#LoginPage.tsx` 绑定入口**

```tsx
import { useKModal } from '@/components/KModal';
import { openForgotModal, openRegisterModal } from './#loginModalService';

const modal = useKModal();

const onOpenRegister = async () => {
  await openRegisterModal(modal);
};

const onOpenForgot = async () => {
  await openForgotModal(modal);
};
```

- [ ] **Step 5: 运行弹窗服务测试并提交**

Run: `pnpm test:run -- src/routes/login/__tests__/loginModalService.test.tsx`  
Expected: PASS，2 个用例通过。

```bash
git add admin-rsbuild/src/routes/login/#loginModalService.tsx admin-rsbuild/src/routes/login/#RegisterModal.tsx admin-rsbuild/src/routes/login/#ForgotModal.tsx admin-rsbuild/src/routes/login/#LoginPage.tsx admin-rsbuild/src/routes/login/__tests__/loginModalService.test.tsx
git commit -m "feat(login): 接入KModal注册与找回弹窗展示交互"
```

## Task 5: 样式按 login.pen 收口并完成回归验证

**Files:**
- Create: `admin-rsbuild/src/routes/login/#login.styled.tsx`
- Create: `admin-rsbuild/src/routes/login/#login-form.styled.tsx`
- Delete: `admin-rsbuild/src/routes/#LoginPage.tsx`
- Delete: `admin-rsbuild/src/routes/#login.styled.tsx`
- Delete: `admin-rsbuild/src/routes/#login-form.styled.tsx`
- Delete: `admin-rsbuild/src/routes/login.module.less`（若无引用）

- [ ] **Step 1: 重建浅色科技风样式骨架（与画布信息结构对齐）**

```tsx
import styled from 'styled-components';

/**
 * 登录页视觉变量只在当前页面作用域内生效，避免污染全局主题。
 */
export const LoginViewport = styled.div`
  --login-bg: #f5f8ff;
  --login-panel: #ffffff;
  --login-text: #111a33;
  --login-text-secondary: #5a6b9a;
  --login-primary: #3b6bff;
  min-height: 100vh;
  background: radial-gradient(circle at 0 0, #eaf1ff 0%, transparent 34%), #f5f8ff;
`;

export const SectionGrid = styled.div`
  width: min(1200px, 100%);
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 24px;
`;
```

- [ ] **Step 2: 在 `#login-form.styled.tsx` 收口卡片、错误提示、入口行样式**

```tsx
import { Button, Form } from 'antd';
import styled from 'styled-components';

export const CardWrapper = styled.section`
  border-radius: 20px;
  border: 1px solid #e6ecff;
  background: #ffffff;
  padding: 40px;
`;

export const WarningBanner = styled.div`
  margin-bottom: 16px;
  border: 1px solid #ffd4b8;
  background: #fff4ec;
  color: #b54708;
  padding: 10px 12px;
  border-radius: 10px;
`;

export const StyledForm = styled(Form)`
  .login-entry-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
`;

export const StyledSubmitButton = styled(Button)`
  && {
    height: 46px;
    border-radius: 10px;
    font-weight: 700;
  }
`;
```

- [ ] **Step 3: 运行完整回归（测试 + lint + 构建）**

Run: `pnpm test:run`  
Expected: PASS，新增登录相关测试全部通过。

Run: `pnpm lint`  
Expected: PASS，无新增 lint 报错。

Run: `pnpm build`  
Expected: PASS，`routeTree.gen.ts` 与构建产物生成正常。

- [ ] **Step 4: 清理旧文件并提交收口**

```bash
git add admin-rsbuild/src/routes/login admin-rsbuild/src/routeTree.gen.ts
git rm admin-rsbuild/src/routes/#LoginPage.tsx admin-rsbuild/src/routes/#login.styled.tsx admin-rsbuild/src/routes/#login-form.styled.tsx admin-rsbuild/src/routes/login.module.less
git commit -m "refactor(login): 按login.pen完成页面与样式重构并清理旧实现"
```

## Task 6: 交付核查与说明

**Files:**
- Review only: 本次所有改动文件

- [ ] **Step 1: 对照 spec 逐条核查范围**

Run: `rg -n "ApiPassport\\.passwordLogin|setToken\\(|openRegisterModal|openForgotModal" admin-rsbuild/src/routes/login`  
Expected: 仅存在登录接口调用，注册/找回没有新增 API 调用。

- [ ] **Step 2: 约束扫描（无三元、注释规范、文件长度）**

Run: `rg -n "\\?.*:" admin-rsbuild/src/routes/login`  
Expected: 无业务新增三元表达式命中。

Run: `wc -l admin-rsbuild/src/routes/login/*.tsx admin-rsbuild/src/routes/login/*.ts`  
Expected: 单文件行数可控；若超过 400 行需立即拆分后再交付。

- [ ] **Step 3: 最终提交**

```bash
git add admin-rsbuild
git commit -m "chore(login): 完成登录页重构交付核查"
```

## Spec 覆盖映射

- 登录主页面按 `login.pen` 重构：Task 3、Task 5
- 注册/找回弹窗展示交互：Task 4、Task 5
- 接口逻辑不变：Task 2、Task 6
- 文件集中到登录目录：Task 2、Task 5
- 必要单元测试：Task 1、Task 3、Task 4、Task 5

## 计划自检

- **Spec 覆盖**：已覆盖架构、数据流、交互、测试四个章节要求，无遗漏任务。
- **占位词检查**：全文无 `TODO`、`TBD`、`后续补充`、`类似 Task N` 等占位描述。
- **一致性检查**：统一使用 `openRegisterModal/openForgotModal`、`getLoginErrorMessage/handleLoginSuccess` 命名。
- **范围检查**：仅涉及前端登录目录与测试基建，不包含后端接口扩展。
