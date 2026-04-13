# 权限通配符与资源组实施记录

## 摘要
- 权限资源支持 `*` 单层通配与 `**` 深层通配。
- 新增平台级“权限资源组”，一个资源组可配置多个权限资源。
- 角色可同时绑定直接资源与资源组，运行期权限取并集。
- 项目、任务、文件访问配置、AI 对话等业务接口补齐了后端权限注解。
- 前端新增资源组管理页，并改造角色权限抽屉支持“资源组 + 直接资源”双轨授权。

## 关键实现
- 后端新增 `PermissionPathMatcher`，统一通配符匹配规则。
- 后端新增 `permission_group`、`permission_group_resource`、`role_permission_group` 三张表。
- `PermissionService` 改为基于“角色直绑资源 + 资源组展开资源”计算当前权限与接口鉴权。
- `/role/permission` 与 `/role/permission/update` 改为返回和接收：
  - `resources`
  - `resourceGroupCodes`
- 新增 `/permission-group/*` 资源组管理接口。
- 新增迁移 `V1.20260413110000__permission_group_and_rbac_resources.sql`：
  - 创建资源组相关表
  - 补齐资源组管理、项目、任务、文件配置相关资源节点
  - 为默认角色补齐新增资源授权

## 前端改造
- `src/utils/permission.ts` 增加统一资源匹配函数，按钮权限与路由权限都支持通配符。
- 新增 `/system/permission-group/` 页面用于维护资源组。
- 角色权限抽屉改为可同时编辑：
  - 资源组绑定
  - 直接资源与通配资源
- 项目管理、任务列表、项目成员、文件访问配置等页面按按钮权限做显隐控制。

## 验证
- 已通过前端测试：
  - `pnpm --dir admin-rsbuild test:run src/utils/__tests__/permission.test.ts`
- 已通过前端构建：
  - `pnpm --dir admin-rsbuild build`
- 后端编译校验已启动，但首次需要下载 Maven 依赖，耗时较长；最终结果以本地编译输出为准。
