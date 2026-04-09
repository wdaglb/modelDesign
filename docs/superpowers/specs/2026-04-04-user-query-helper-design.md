# 2026-04-04 用户查询辅助设计

## 背景
- 当前用户管理列表的 API 只返回基础字段，页面只用昵称+租户 ID 简单筛选，无法满足即将要封装的高级搜索（包含关键字、用户名、ID、禁用状态、是否存在角色/职位等）。
- 既然后端已经支持这些查询参数，就需要前端类型补全，保证检索 UI 传参一致，并提供一套可重用的助手函数方便后续扩展。

## 目标
- 补全 `User` 和 `UserPageParams` 类型，新增字段 `roleNames`、`positionNames`、`hasRole`、`hasPosition`、`lastLoginTime`、`updatedAt` 以及更多查询参数。
- 提供 `createDefaultUserFilterValues`、`buildUserPageParams`、`hasAdvancedUserFilterValue` 三个辅助函数，帮助表格组件统一构造请求参数、判断是否处于高级筛选状态。
- 使用 TDD 思路先写测试，再实现最小逻辑，并在 `userQueryHelper.test.ts` 中验证关键词+分页组合、空值剔除且保留布尔筛选的行为。

## 方案探索
1. **轻量助手（推荐）**：在 `#userQueryHelper` 中定义 `UserQueryFilterValues` 类型，分别提供默认赋值、构造参数、判断高级筛选的函数，调用时由表格组件组合分页和筛选。优点是依赖少、生命周期可控；缺点是需要在每个使用点显式管理。推荐。
2. **复用现有查询状态钩子**：如果已有通用 `useQueryHelper` 模式，可以把用户筛选器也抽出一个 hook，代码更加统一，但需要重构现有页面状态管理，扩展成本高。暂时不选。
3. **引入通用字段筛选构建器**：借助通用库处理 trim/omit/boolean 逻辑，避免自写。但当前项目较小，拉入新依赖违背“先做对再美化”的原则。

## 推荐方案细节
- 继续在 `#UserTable` 周边维护分页+筛选状态，新增 `#userQueryHelper` 提供三大工具函数。
  - `createDefaultUserFilterValues()` 负责返回一份全新增量的初始状态，避免沿用同一个对象。
  - `buildUserPageParams({ pagination, filters })` 会按 `UserPageParams` 定义拼装分页和筛选字段，字符串会 `trim`，空串不传，布尔只要不是 `undefined` 就保留。
  - `hasAdvancedUserFilterValue(filters)` 检查任一高级字段是否实际生效（包括 `false` 这样的布尔值）。
- `UserPageParams` 会新增 `keyword`、`username`、`userId`、`isDisable`、`hasRole`、`hasPosition` 等属性，`User` 也补上角色+职位列表、布尔指标和时间戳，保持和后端字段完全一致。

## 实施步骤
1. 在 `admin-rsbuild/src/api/modules/user.ts` 中扩展 `User` 与 `UserPageParams` 的声明，并导出我们会在 helper 中使用的新类型（如 `UserPageParams`）。
2. 创建 `admin-rsbuild/src/routes/system/user/#userQueryHelper.ts`，定义 `UserQueryFilterValues`、三大函数以及必要的内部格式化逻辑。
3. 创建对应测试 `admin-rsbuild/src/routes/system/user/__tests__/userQueryHelper.test.ts`，先写测试再实现，确保命名符合项目 ESLint 规则。
4. 按要求先运行 `pnpm vitest run src/routes/system/user/__tests__/userQueryHelper.test.ts` 验证。

## 验证方案
- 测试一：`buildUserPageParams` 接受分页（`current`/`pageSize`）和带空格的 `keyword`，返回分页字段+`keyword` 且已 `trim`。
- 测试二：`buildUserPageParams` 接受空串/`undefined` 的高级字段以及 `false` 布尔值，空串不出现在结果，`false` 仍出现在结果。
- 测试三：`hasAdvancedUserFilterValue` 在只有默认值时返回 `false`，但 `keyword.trim()` 后非空或布尔 `false` 时返回 `true`。
- 使用 `pnpm vitest run src/routes/system/user/__tests__/userQueryHelper.test.ts`。

## 待确认
- 目前假设 `keyword`/`username`/`userId`/`isDisable` 等字段在 trim 后为空即不传，同时必须明确 `hasRole`/`hasPosition` 这种布尔筛选即使为 `false` 也应传给后端；如有不同，请指出。
