# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 交流与语言

- 始终使用简体中文回复用户。
- 代码注释、修改说明、提交信息也使用中文。

## 仓库概览

这是一个全栈 monorepo，目前实际工作区包含两个主要部分：

- `admin-rsbuild/`：React 18 + TypeScript + Rsbuild + Ant Design 前端
- `modelDesign/`：Spring Boot 3.5 + Spring AI + Maven 多模块后端

## 前端

### 架构与构建

- 使用 Rsbuild + React 插件，配置见 `admin-rsbuild/rsbuild.config.ts`。
- TanStack Router 通过 `@tanstack/router-plugin` 自动扫描 `src/routes/` 生成 `src/routeTree.gen.ts`。
- `#` 前缀文件会被路由生成器忽略，适合作为页面私有子组件。
- 新增路由时必须使用 `createFileRoute(...)` 导出 `Route`，不要只默认导出组件。
- `src/routeTree.gen.ts` 是生成文件，不要手改。

### 分层结构

- `src/routes/`：页面路由入口，负责页面级组装
- `src/components/`：可复用 UI 组件与业务组件
- `src/hooks/`：页面/业务 hooks，常见模式是封装请求状态与交互逻辑
- `src/api/modules/`：按业务域组织的接口类型与请求函数
- `src/store/`：Zustand 全局状态
- `src/service/`：跨页面业务逻辑
- `src/utils/`：请求封装、通用工具

### 代码风格与命名

- ESLint 使用 flat config，Prettier 使用 2 空格和单引号
- import 顺序：外部库 → `@/` 别名 → 相对路径
- 组件名用 PascalCase，hooks 用 `useXxx`，路由文件优先 kebab-case
- 页面私有子组件使用 `#` 前缀文件名

### 约定

- `@/` 指向 `src/`
- 图标统一走 `unplugin-icons` + `mdi`，集中在 `admin-rsbuild/src/icons.ts`
- 接口请求参数、响应字段、表单字段、查询参数统一使用 `camelCase`
- 组件内部局部状态和普通变量可使用 `camelCase`
- 状态管理采用 Zustand；服务端状态优先使用 TanStack Query
- 请求错误模式见 `src/utils/request.ts`，页面交互通常配合 `message.error()` 和 `Modal.confirm()`
- 页面中的弹窗与抽屉优先使用项目封装的 `KModal`、`KDrawer`，不要直接使用原生 `Modal`、`Drawer` 作为业务承载容器；`Modal.confirm()` 这类轻量确认场景除外
- 页面中的表格渲染优先使用项目封装的 `KTable`，只有在现有 `KTable` 明显不适用时才使用原生 `Table`
- 使用 `KTable` 时，工具栏按钮优先使用 `KTable.Button`，它会自动触发 `KTable` 刷新
- 一定要补充好代码注释
- 禁止使用三元表达式，特别是嵌套的
- 项目已经在使用 Ant Design v6 风格 API，避免继续使用已废弃组件与属性，废弃的组件与参数可以阅读(https://ant.design/llms.txt)
- 分页接口响应格式：{"items": [...], "total": 总数}

## 后端

- server/
- 基于golang1.26+gin+gorm框架
- 数据库postgresql+redis
- 注释应该只保留有必要的文档注释，模型、请求体字段的注释是必要的
- 方法不应只有方法注释，字段的注释也是必要的
- 注释风格应该使用golang的风格，而不是/** */
- 接口的增删改、参数变更都需要通过apifox mcp同步到projectId=8022980
