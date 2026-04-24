# AI编码助手

## 交流与语言

- 始终使用简体中文回复用户。
- 代码注释、修改说明、提交信息也使用中文。

## 仓库概览

这是一个全栈 monorepo，目前实际工作区包含两个主要部分：

- 这是一个多租户的项目，区分租户以tenantId作数据隔离
- 不需要做移动端的布局兼容
- `admin-rsbuild/`：React 18 + TypeScript + Rsbuild + Ant Design 前端
- `modelDesign/`：Spring Boot 3.5 + Spring AI + Maven 多模块后端
- 接口文档：http://localhost:9999/v3/api-docs；openapi格式

## 强制规范

- 一定要补充好代码注释，但不能太泛滥；注释格式：/** */，不能使用单行
- 路由约定，像 login/index.tsx 都是“目录 + index.tsx 入口”的模式，这样生成的url：/login。
- 禁止使用三元表达式，特别是嵌套的
- 单个文件超过400行，就需要考虑逻辑切割；单行代码建议不超过90个字符
- 编写必要的单元测试

## 前端

### 架构与构建

- 使用 Rsbuild + React 插件，配置见 `admin-rsbuild/rsbuild.config.ts`。
- 布局使用`ant design`，尽量避免自己造组件
- 非按ui设计稿时，尽量使用`ant design` 来实现布局与样式，**可以使用组件属性调整时不要使用自定义css样式**.
- TanStack Router 通过 `@tanstack/router-plugin` 自动扫描 `src/routes/` 生成 `src/routeTree.gen.ts`。
- `#` 前缀文件会被路由生成器忽略，适合作为页面私有子组件。
- 新增路由时必须使用 `createFileRoute(...)` 导出 `Route`，不要只默认导出组件。
- `src/routeTree.gen.ts` 是生成文件，不要手改。
- 简单样式可以直接写style，复杂样式再使用styled-components编写

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
- 项目已经在使用 Ant Design v6 风格 API，避免继续使用已废弃组件与属性，废弃的组件与参数可以阅读(https://ant.design/llms.txt)
- 分页接口响应格式：{"items": [...], "total": 总数}

## 后端

- modelDesign/
- 数据库postgresql+redis
- 接口需要增加swagger的注解

## 单元测试命令经验

### 前端测试

- 前端单测在 `admin-rsbuild/` 目录执行。
- 优先使用 `npm run test:run -- <具体测试文件>` 按文件精确运行，避免全量测试影响效率。
- 示例：
  - `npm run test:run -- src/__tests__/initialState.test.ts`
  - `npm run test:run -- src/store/__tests__/auth.test.ts`

### 后端测试

- 后端单测统一以 `modelDesign/boot` 作为入口模块执行，不要直接在业务子模块上单独跑 `mvn test`。
- 推荐命令：
  - `./mvnw -pl boot -am -Dtest=AuthServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`
- 经验说明：
  - `-pl boot -am` 可以把 `boot` 依赖的上游模块一起编译，避免单独跑 `mod-auth-biz` 时出现依赖模块未参与编译的问题。
  - `-Dsurefire.failIfNoSpecifiedTests=false` 可以避免聚合链路里某些无匹配测试模块直接失败。
  - 如果目标测试已经通过，但 reactor 后续在其他模块测试编译阶段失败，应区分“本次目标模块验证通过”和“仓库其他模块已有问题”，不要误判为当前改动直接导致。

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **modelDesign** (10440 symbols, 21454 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/modelDesign/context` | Codebase overview, check index freshness |
| `gitnexus://repo/modelDesign/clusters` | All functional areas |
| `gitnexus://repo/modelDesign/processes` | All execution flows |
| `gitnexus://repo/modelDesign/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
