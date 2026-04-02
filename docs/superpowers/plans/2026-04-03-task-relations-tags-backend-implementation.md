# 任务关系与标签后端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `mod-project` 后端落地一级子任务、多前置依赖、租户内共享标签库，并补齐 `project.tenantId` 租户隔离、依赖就绪通知和变更日志能力。

**Architecture:** 以 `projectTask` 为真实任务主表，新增 `projectTaskDependency` 与 `projectTaskTag` 两张关系表、`taskTag` 标签库表，分别承载依赖关系和标签挂载。`project` 显式增加 `tenantId`，任务通过项目继承租户边界，标签通过 `tenantId` 做租户内共享。`ProjectTaskService` 只保留编排职责，关系校验、标签绑定、依赖判断拆到独立服务，避免继续放大现有 800+ 行文件。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Flyway、PostgreSQL、mod-auth-api、mod-system-api、Swagger(OpenAPI)

---

> 说明：仓库 `AGENTS.md` 要求“无需执行命令验证”，本计划以代码落地步骤和静态核查点为主，不把运行测试命令作为必做步骤。

## 文件结构与职责

### 新增文件

- `modelDesign/boot/src/main/resources/db/migration/V1.20260403120000__mod_project_project_tenant_init.sql`
  - 给 `project` 增加 `tenantId`
  - 回填历史项目租户归属
  - 增加租户索引

- `modelDesign/boot/src/main/resources/db/migration/V1.20260403121000__mod_project_task_relation_tag_init.sql`
  - 给 `projectTask` 增加 `parentTaskId`
  - 新建 `projectTaskDependency`、`taskTag`、`projectTaskTag`
  - 增加唯一约束和索引

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTaskDependency.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/TaskTag.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTaskTag.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/ProjectTaskDependencyMapper.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/TaskTagMapper.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/ProjectTaskTagMapper.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagCreateRequest.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagEditRequest.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagDeleteRequest.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagListRequest.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskTagVo.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskPredecessorVo.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskTagController.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/TaskTagService.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDependencyService.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskTagBindingService.java`

### 修改文件

- `modelDesign/mod-auth/mod-auth-api/src/main/java/io/github/modelDesign/auth/api/dto/AuthCurrentUserDto.java`
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/api/AuthCurrentUserApiImpl.java`

- `modelDesign/mod-project/mod-project-biz/pom.xml`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/Project.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTask.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskCreateRequest.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskEditRequest.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectDetailVo.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDetailVo.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectService.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskBoardQueryService.java`
- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskChangeLogService.java`

- `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/enums/ProjectTaskChangeOperationTypeEnum.java`

### 不改动文件

- 前端 `admin-rsbuild` 全部文件
- `mod-system` 业务实现文件

原因说明：

- 本轮需求明确为纯后端交付
- 系统消息发布能力已有 `SystemMessageApi` 可直接复用，不需要改 `mod-system` 内部实现

## Task 1: 数据迁移与基础实体落地

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260403120000__mod_project_project_tenant_init.sql`
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260403121000__mod_project_task_relation_tag_init.sql`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/Project.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTask.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTaskDependency.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/TaskTag.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/domain/ProjectTaskTag.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/ProjectTaskDependencyMapper.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/TaskTagMapper.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/mapper/ProjectTaskTagMapper.java`

- [ ] Step 1: 编写 `project.tenantId` 迁移脚本，字段先加默认值再回填，最后收口为非空约束
- [ ] Step 2: 在同一迁移中按 `project.creatorId -> user.id` 关联回填 `tenantId`，并补 `idx_project_tenantId`
- [ ] Step 3: 编写任务关系与标签迁移脚本，新增 `parentTaskId`、`projectTaskDependency`、`taskTag`、`projectTaskTag`
- [ ] Step 4: 为依赖表与任务标签关系表加唯一约束，防止重复依赖和重复挂载
- [ ] Step 5: 为标签库加 `uk_taskTag_tenant_name`，落实“租户内标签名称唯一”
- [ ] Step 6: 更新 `Project`、`ProjectTask` 实体字段，并新增 3 个关系实体与 Mapper
- [ ] Step 7: 提交一次“数据结构基础落地”变更

## Task 2: 租户上下文打通与项目服务隔离

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-api/src/main/java/io/github/modelDesign/auth/api/dto/AuthCurrentUserDto.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/api/AuthCurrentUserApiImpl.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectDetailVo.java`

- [ ] Step 1: 在 `AuthCurrentUserDto` 增加 `tenantId` 字段，并在 `AuthCurrentUserApiImpl` 返回值中回填 `CurrentAdmin.tenantId`
- [ ] Step 2: 修改 `ProjectService.getList/getDetail/requireProject` 查询条件，统一附加 `tenantId = currentUser.tenantId`
- [ ] Step 3: 修改 `ProjectService.create`，创建项目时写入 `tenantId`，且项目编号唯一性检查改为“租户内唯一”
- [ ] Step 4: 修改 `ProjectDetailVo` 与 `toProjectVo`，补充只读字段 `tenantId`
- [ ] Step 5: 静态核查项目读写入口，确保不存在跨租户读取项目的遗漏路径
- [ ] Step 6: 提交一次“租户隔离基线”变更

## Task 3: 标签管理后端接口

**Files:**
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagCreateRequest.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagEditRequest.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagDeleteRequest.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskTagListRequest.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskTagVo.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/TaskTagService.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/controller/ProjectTaskTagController.java`

- [ ] Step 1: 新增标签 CRUD 请求对象，字段只包含 `name`、`color`、`sort`，并补齐 Swagger 与校验注解
- [ ] Step 2: 在 `TaskTagService` 实现按租户隔离的列表、新增、编辑、删除
- [ ] Step 3: 新增“标签重名”校验，规则为同租户 `name` 唯一，错误提示为中文
- [ ] Step 4: 在删除逻辑中调用任务标签绑定服务做“先解绑后删除”，保证事务一致性
- [ ] Step 5: 新增 `ProjectTaskTagController`，提供 `/project/task/tag/list|create|edit|deleted` 接口
- [ ] Step 6: 提交一次“标签管理后端能力”变更

## Task 4: 任务依赖与标签绑定域服务

**Files:**
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDependencyService.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskTagBindingService.java`
- Create: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskPredecessorVo.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/TaskStatusConfigService.java`

- [ ] Step 1: 在 `ProjectTaskDependencyService` 实现依赖覆盖保存、循环依赖检测、依赖完成判定
- [ ] Step 2: 明确“起始待处理态”获取逻辑，新增 `TaskStatusConfigService` 方法返回“首个非完成状态编码”
- [ ] Step 3: 在 `ProjectTaskTagBindingService` 实现任务标签覆盖绑定与批量查询能力
- [ ] Step 4: 在标签绑定逻辑中校验任务项目租户与标签租户一致，禁止跨租户绑定
- [ ] Step 5: 对外暴露 `canStart(taskId)` 与 `findUnfinishedPredecessors(taskId)`，给任务服务和查询层复用
- [ ] Step 6: 提交一次“关系域服务拆分”变更

## Task 5: 任务写入流程改造（创建、编辑、删除、状态推进）

**Files:**
- Modify: `modelDesign/mod-project/mod-project-biz/pom.xml`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskCreateRequest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/request/ProjectTaskEditRequest.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`

- [ ] Step 1: 在 `mod-project-biz/pom.xml` 增加 `mod-system-api` 依赖，准备接入消息发布
- [ ] Step 2: 扩展任务创建/编辑请求字段：`parentTaskId`、`predecessorTaskIds`、`tagIds`
- [ ] Step 3: 在 `ProjectTaskService.create/edit` 中接入父任务校验、依赖校验、标签绑定，所有写入动作放在同一事务
- [ ] Step 4: 新增“前置未完成时限制状态推进”校验，只允许保存到起始待处理态
- [ ] Step 5: 新增“父任务有未完成子任务时禁止手动完成”校验
- [ ] Step 6: 改造删除任务逻辑，被其他任务依赖时直接拒绝删除
- [ ] Step 7: 从 `ProjectTaskService` 拆出高复杂度私有逻辑到域服务，避免继续放大 800+ 行服务文件
- [ ] Step 8: 提交一次“任务写流程改造”变更

## Task 6: 自动完成与依赖就绪通知

**Files:**
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskDependencyService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskChangeLogService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/enums/ProjectTaskChangeOperationTypeEnum.java`

- [ ] Step 1: 在任务状态从未完成转完成时，触发“父任务子任务全完成检测”
- [ ] Step 2: 若父任务满足自动完成条件，系统自动更新到完成状态并记录 `AUTO_COMPLETE`
- [ ] Step 3: 增加依赖就绪检测，仅在“不可开始 -> 可开始”的状态跃迁时发布一次通知
- [ ] Step 4: 通过 `SystemMessageApi.publish` 发送个人消息，作用域用 `USER`，租户取任务所属项目租户
- [ ] Step 5: 扩展变更日志操作类型，增加 `RELATION_UPDATE`、`TAG_BINDING_UPDATE`、`AUTO_COMPLETE`、`DEPENDENCY_READY`
- [ ] Step 6: 提交一次“自动完成与通知”变更

## Task 7: 查询返回增强

**Files:**
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/response/ProjectTaskDetailVo.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskService.java`
- Modify: `modelDesign/mod-project/mod-project-biz/src/main/java/io/github/modelDesign/project/service/ProjectTaskBoardQueryService.java`

- [ ] Step 1: 扩展 `ProjectTaskDetailVo`：`parentTaskId`、`parentTaskTitle`、`childTaskCount`、`completedChildTaskCount`
- [ ] Step 2: 扩展 `ProjectTaskDetailVo`：`predecessorTaskIds`、`predecessorTasks`、`tagIds`、`tags`、`canStart`、`blockedReason`
- [ ] Step 3: 在任务列表和详情查询中统一组装上述字段，避免调用方重复计算
- [ ] Step 4: 在敏捷面板查询服务中补齐新增字段赋值，保持返回结构一致
- [ ] Step 5: 静态核查所有 `ProjectTaskDetailVo.builder()` 调用点，确保新字段不会遗漏或空指针
- [ ] Step 6: 提交一次“查询增强”变更

## Task 8: 规范收口与交付检查

**Files:**
- Review only: `docs/superpowers/specs/2026-04-03-task-relations-design.md`
- Review only: 本次所有新增与修改文件

- [ ] Step 1: 对照 spec 逐项核查，确认子任务、后续依赖、标签、租户边界、通知、日志全部有落点
- [ ] Step 2: 扫描新增代码，确保注释使用 `/** */`，且无三元表达式
- [ ] Step 3: 核查 `ProjectTaskService` 是否完成逻辑下沉，避免继续恶化大文件问题
- [ ] Step 4: 输出交付摘要与未覆盖项，明确“本轮不含前端改造”
- [ ] Step 5: 按任务粒度整理提交记录，保持每次提交都可独立回滚

## Spec 覆盖映射

- 子任务能力：Task 1、Task 4、Task 5、Task 6、Task 7
- 后续任务依赖与状态拦截：Task 4、Task 5、Task 6、Task 7
- 依赖就绪通知：Task 6
- 任务标签能力：Task 1、Task 3、Task 4、Task 5、Task 7
- 租户边界与 `project.tenantId`：Task 1、Task 2、Task 4、Task 5
- 部署与回填要求：Task 1、Task 8

## 计划自检

- 已完成占位词检查：无 `TODO`、`TBD`、`待补` 占位文本
- 已完成一致性检查：字段命名统一使用 `tenantId`、`parentTaskId`、`predecessorTaskIds`、`tagIds`
- 已完成范围检查：仅后端，未引入前端任务
