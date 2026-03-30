---
name: 'tanstack-router-route'
description: '在本项目中使用 TanStack Router 新增路由页面的统一规范。当需要新增页面路由时，指导如何使用 createFileRoute 正确导出 Route 对象，避免仅默认导出组件导致路由不生效的问题。'
---

# TanStack Router 路由文件规范（本项目 Skill）

## 适用范围

当需要在 `admin-rsbuild/src/routes/` 目录下新增前端页面路由时，必须遵循本 Skill 约定，使用 TanStack Router 的 `createFileRoute` 定义路由，而不是仅默认导出一个 React 组件。

## 统一约定

1. **每个路由文件必须导出 `Route` 常量**
2. **路由通过 `createFileRoute` 定义路径与组件**
3. **页面组件写在 `RouteComponent` 函数中**

## 标准模板

新建路由文件时，请以此为模板：

```tsx
import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/your/path')({
  component: RouteComponent,
});

function RouteComponent() {
  // 页面逻辑
  return <div>页面内容</div>;
}
```

> 只有这样导出的 `Route` 才会被 TanStack Router 识别为合法路由。

## 文件命名与路径关系

本项目使用 TanStack Router 的**文件路由**，但最终访问路径以 `createFileRoute` 的参数为准：

- `src/routes/index.tsx` → `createFileRoute('/')` → `/`
- `src/routes/login.tsx` → `createFileRoute('/login')` → `/login`
- `src/routes/project/index.tsx` → `createFileRoute('/project/')` → `/project/`
- `src/routes/project/$projectId.index.tsx` → `createFileRoute('/project/$projectId/')` → `/project/:projectId/`
- `src/routes/ai.chat.tsx` → `createFileRoute('/ai/chat')` → `/ai/chat`

**结论**：
- 文件名用于文件路由结构组织
- 真实访问路径由 `createFileRoute('/xxx')` 决定

## 典型错误模式（需避免）

以下写法在本项目中是错误的：

```tsx
// ❌ 错误：只默认导出组件，没有导出 Route
const AiChatPage: React.FC = () => {
  return <div>AI 聊天</div>;
};

export default AiChatPage;
```

问题：
- TanStack Router 不会扫描默认导出的组件
- 该文件不会被识别为一个路由，访问对应路径会 404 或完全无法跳转

## 正确示例：AI 聊天页面

本项目中 AI 聊天页面的标准实现位于：
`admin-rsbuild/src/routes/ai.chat.tsx`

示例代码：

```tsx
import React from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { Flex } from 'antd';

import ChatPanel from '@/components/business/AiChat/ChatPanel';
import { useAiChat } from '@/hooks/useAiChat';

export const Route = createFileRoute('/ai/chat')({
  component: RouteComponent,
});

function RouteComponent() {
  const { messages, loading, sendMessage, clearMessages } = useAiChat();

  return (
    <Flex style={{ padding: 16 }}>
      <ChatPanel
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onClear={clearMessages}
      />
    </Flex>
  );
}
```

## 使用本 Skill 的步骤

新增路由页面时，请按以下步骤：

1. 在 `admin-rsbuild/src/routes/` 下新建文件：
   - 简单页面：`foo.tsx`，对应路径建议 `createFileRoute('/foo')`
   - 嵌套路由或动态路由：参考现有 `project`、`system/policy` 目录命名

2. 在新文件中：
   - 引入：`import { createFileRoute } from '@tanstack/react-router';`
   - 定义并导出：
     ```ts
     export const Route = createFileRoute('/your/path')({
       component: RouteComponent,
     });
     ```
   - 编写 `RouteComponent` 页面组件逻辑

3. 启动或刷新前端后，直接访问 `createFileRoute` 中配置的路径进行验证。

## 快速自检清单

新增或修改路由文件后，简单检查：

- [ ] 是否位于 `admin-rsbuild/src/routes/`？
- [ ] 是否 `import { createFileRoute } from '@tanstack/react-router'`？
- [ ] 是否 `export const Route = createFileRoute('...')({ component: RouteComponent })`？
- [ ] 页面组件是否写在 `RouteComponent` 中？
- [ ] 访问路径是否与 `createFileRoute` 中字符串一致？

如果以上任一项不满足，很可能会出现“文件存在但路由不生效”的问题。
