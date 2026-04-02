# 职位功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为系统管理增加职位 CRUD 与用户多对多绑定职位能力，并满足多租户隔离、物理删除自动解绑和用户侧绑定交互。

**Architecture:** 后端在 `mod-auth` 内新增独立的职位实体、关系实体、服务与控制器，不复用 Casbin 关系；前端在系统管理下新增职位管理页，并在用户管理页增加“绑定职位”抽屉。职位与用户的关系使用业务中间表 `userPosition` 维护，所有绑定校验都在后端以租户一致性为准。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Flyway、React 18、TypeScript、TanStack Router、TanStack Query、Ant Design、KTable、KModal

---

> 说明：仓库 `AGENTS.md` 明确“不需要执行命令验证”，因此本计划按代码与结构落地，不把运行测试/构建作为必做步骤。

### Task 1: 数据迁移与后端基础建模

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260402xxxxxx__mod_auth_position_init.sql`
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260402xxxxxx__mod_auth_position_menu.sql`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/domain/Position.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/domain/UserPosition.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/mapper/PositionMapper.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/mapper/UserPositionMapper.java`

- [ ] Step 1: 新增职位表与关系表迁移，补唯一约束、索引和菜单数据
- [ ] Step 2: 新增 `Position` 与 `UserPosition` 实体，字段命名与现有 `Role`、`ProjectMember` 保持一致
- [ ] Step 3: 新增 mapper，确保后续服务层可直接复用 MyBatis-Plus 能力
- [ ] Step 4: 提交一次基础结构变更

### Task 2: 后端请求、响应、服务与控制器

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionAddRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionUpdateRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionListRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionUpdateStatusRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionBatchUpdateStatusRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/PositionDeleteRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/UserPositionUpdateRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/PositionListItemVo.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PositionService.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserPositionService.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/PositionController.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/UserController.java`

- [ ] Step 1: 新增职位相关 request / response 对象，并补齐 Swagger 注解和校验约束
- [ ] Step 2: 在 `PositionService` 中实现列表、新增、编辑、单条状态切换、批量状态切换、物理删除
- [ ] Step 3: 在 `UserPositionService` 中实现“查询用户职位 ID 列表”和“覆盖式更新用户职位绑定”
- [ ] Step 4: 在 `UserController` 中增加 `/user/positions` 与 `/user/positions/update`
- [ ] Step 5: 保证删除职位与清空绑定、更新职位绑定都使用事务
- [ ] Step 6: 提交后端接口能力

### Task 3: 前端 API、query key 与路由接入

**Files:**
- Create: `admin-rsbuild/src/api/modules/position.ts`
- Create: `admin-rsbuild/src/constants/queryKey/position.ts`
- Create: `admin-rsbuild/src/routes/system/position/index.tsx`
- Modify: `admin-rsbuild/src/api/index.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/index.ts`

- [ ] Step 1: 新增职位模块 API，覆盖列表、新增、编辑、状态修改、批量状态修改、删除、按用户查询职位与更新绑定
- [ ] Step 2: 新增职位 query key，风格对齐 `user.ts` 与 `role.ts`
- [ ] Step 3: 新增职位管理路由入口 `createFileRoute('/system/position/')`
- [ ] Step 4: 接入统一导出，保证其他页面可直接引用
- [ ] Step 5: 提交前端基础接线

### Task 4: 职位管理页

**Files:**
- Create: `admin-rsbuild/src/routes/system/position/#PositionTable.tsx`
- Create: `admin-rsbuild/src/routes/system/position/#CreatePositionForm.tsx`
- Create: `admin-rsbuild/src/routes/system/position/#UpdatePositionForm.tsx`
- Create: `admin-rsbuild/src/routes/system/position/#BatchUpdateForm.tsx`
- Modify: `admin-rsbuild/src/routes/system/position/index.tsx`

- [ ] Step 1: 实现职位列表表格，支持名称/编码搜索、租户筛选、状态展示和操作列
- [ ] Step 2: 实现新增职位表单，字段为租户、名称、编码、排序、备注、状态
- [ ] Step 3: 实现编辑职位表单，保持与新增字段一致
- [ ] Step 4: 实现批量启用/禁用表单与删除确认交互
- [ ] Step 5: 保持所有交互建立在 `KTable`、`KModal` 现有模式上
- [ ] Step 6: 提交职位管理页面

### Task 5: 用户管理页绑定职位

**Files:**
- Create: `admin-rsbuild/src/routes/system/user/#PositionDrawer.tsx`
- Modify: `admin-rsbuild/src/routes/system/user/#UserTable.tsx`

- [ ] Step 1: 新增“绑定职位”抽屉，双栏展示待添加职位和已绑定职位
- [ ] Step 2: 只拉取当前用户租户下的职位，待添加区仅展示启用职位
- [ ] Step 3: 已绑定区允许展示已禁用职位，并允许移除
- [ ] Step 4: 若用户没有 `tenantId`，阻止进入绑定流程并提示原因
- [ ] Step 5: 在用户表格操作列加入“绑定职位”按钮，位置与“绑定角色”风格一致
- [ ] Step 6: 提交用户侧职位绑定能力

### Task 6: 收尾检查

**Files:**
- Review only: `docs/superpowers/specs/2026-04-02-position-design.md`
- Review only: 本次新增与修改的所有文件

- [ ] Step 1: 对照 spec 检查是否覆盖职位 CRUD、删除自动解绑、用户侧绑定、多租户隔离
- [ ] Step 2: 检查新增文件是否遵循现有命名、注释和分层风格
- [ ] Step 3: 检查是否误把职位逻辑放入 Casbin 权限服务
- [ ] Step 4: 整理交付摘要与未做项
