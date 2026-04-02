# 职位功能设计说明

## 1. 背景

当前系统已经具备以下能力：

- 后端在 `mod-auth` 中已实现用户、角色、租户管理
- 前端在系统管理下已提供用户管理、角色管理、租户管理页面
- 用户与角色的多对多关系已经存在，但职位尚未建模

本次目标是在不改变现有权限模型的前提下，增加“职位”这一纯业务资料能力，支持职位管理以及用户与职位的多对多绑定。

## 2. 已确认需求

### 2.1 业务定位

- 职位是纯业务资料，不参与权限控制
- 职位与角色职责分离
- 用户可以绑定多个职位，职位也可以绑定多个用户

### 2.2 删除语义

- 职位支持物理删除
- 删除职位时需要自动清空该职位与所有用户的绑定关系
- 删除与解绑必须在同一个事务中完成

### 2.3 多租户约束

- 职位按租户隔离
- 职位编码只要求租户内唯一
- 用户只能绑定与自己同租户的职位

### 2.4 首版字段范围

职位首版包含以下字段：

- 所属租户 `tenantId`
- 名称 `name`
- 编码 `code`
- 排序 `sort`
- 状态 `status`
- 备注 `remark`

## 3. 目标与非目标

### 3.1 本次目标

- 增加职位管理页
- 支持职位分页查询、新增、编辑、启用/禁用、批量启用/禁用、物理删除
- 支持用户侧绑定职位
- 严格校验用户与职位的租户一致性
- 删除职位时自动清空用户职位关系
- 增加 Swagger 注解与菜单配置

### 3.2 非目标

- 职位参与权限控制
- 职位参与菜单或数据范围计算
- 增加部门、组织架构或岗位树能力
- 增加职位侧独立“绑定用户”管理页面
- 增加用户批量绑定职位能力
- 设计移动端布局

## 4. 方案对比

| 方案 | 说明 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- | --- |
| A. 独立职位表 + 独立关系表 | 新增 `position` 与 `userPosition` 两张业务表 | 语义清晰，方便租户隔离、删除联动与后续扩展 | 需要补全 CRUD 与绑定逻辑 | 采用 |
| B. 复用 Casbin 关系 | 把职位关系也交给 Casbin 管理 | 表面上可复用部分绑定写法 | 业务资料与权限引擎耦合，不利于删除、统计与租户校验 | 不采用 |
| C. 用户表内嵌职位集合 | 在用户记录中直接保存职位集合 | 初看改表较少 | 不是真正多对多，不利于查询、约束与独立管理 | 不采用 |

最终采用方案 A。

## 5. 架构设计

## 5.1 模块归属

- 后端实现放在 `modelDesign/mod-auth/mod-auth-biz`
- 前端实现放在 `admin-rsbuild/src/routes/system/position`

这样做的原因：

- 职位与用户、租户都强相关，放在 `mod-auth` 中最便于复用现有服务与校验逻辑
- 系统管理页当前已经沉淀出统一的列表、弹窗、绑定抽屉模式，前端可直接沿用

## 5.2 后端职责划分

- `PositionController`
  - 暴露职位 CRUD、状态切换、删除接口
- `PositionService`
  - 负责职位列表查询、新增、编辑、状态切换、删除
- `UserPositionService`
  - 负责用户与职位关系维护
  - 负责查询用户已绑定职位、覆盖式更新绑定关系

明确约束：

- 不把职位关系放进现有 `PermissionService`
- 不把职位绑定逻辑分散塞进 `UserService`

原因是职位属于纯业务资料，不能继续污染 Casbin 权限服务边界。

## 6. 数据模型设计

## 6.1 职位表 `position`

建议字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigserial` | 主键 |
| `tenantId` | `bigint` | 所属租户 ID |
| `name` | `varchar(64)` | 职位名称 |
| `code` | `varchar(64)` | 职位编码 |
| `remark` | `varchar(255)` | 备注 |
| `sort` | `integer` | 排序值 |
| `status` | `smallint` | 1 启用，0 禁用 |
| `createTime` | `timestamp` | 创建时间 |
| `updateTime` | `timestamp` | 更新时间 |

约束与索引建议：

- 唯一约束：`uk_position_tenant_code (tenantId, code)`
- 索引：`idx_position_tenantId`
- 索引：`idx_position_tenant_status`
- 索引：`idx_position_tenant_updateTime`

说明：

- `name` 本次不强制唯一，只对 `code` 做租户内唯一约束
- `status` 语义与现有用户、角色保持一致

## 6.2 用户职位关系表 `userPosition`

建议字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigserial` | 主键 |
| `userId` | `bigint` | 用户 ID |
| `positionId` | `bigint` | 职位 ID |
| `createTime` | `timestamp` | 创建时间 |
| `updateTime` | `timestamp` | 更新时间 |

约束与索引建议：

- 唯一约束：`uk_userPosition_user_position (userId, positionId)`
- 索引：`idx_userPosition_userId`
- 索引：`idx_userPosition_positionId`

说明：

- 关系表采用与 `projectMember`、`projectTaskMember` 相同的建模风格
- 使用独立主键与唯一组合约束，方便保持仓库一致性

## 7. 后端接口设计

## 7.1 职位管理接口

新增 `PositionController`，提供以下接口：

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/position/list` | `GET` | 分页获取职位列表 |
| `/position/add` | `POST` | 新增职位 |
| `/position/update?id=` | `POST` | 编辑职位 |
| `/position/update_status` | `POST` | 修改单个职位状态 |
| `/position/batch_update_status` | `POST` | 批量修改职位状态 |
| `/position/delete` | `POST` | 删除职位并清空绑定关系 |

列表筛选参数建议支持：

- `current`
- `pageSize`
- `name`
- `code`
- `tenantId`
- `isDisable`

## 7.2 用户绑定职位接口

本次仅提供用户侧绑定能力，接口仍挂在 `/user` 下：

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/user/positions` | `GET` | 获取用户已绑定职位 ID 列表 |
| `/user/positions/update` | `POST` | 覆盖式更新用户绑定职位 |

约定：

- `positions/update` 传空数组表示清空全部职位绑定
- 不提供增量添加、单条移除接口
- 前后端统一使用覆盖式保存，简化一致性处理

## 7.3 请求对象建议

建议新增以下请求对象：

- `PositionListRequest`
- `PositionAddRequest`
- `PositionUpdateRequest`
- `PositionUpdateStatusRequest`
- `PositionBatchUpdateStatusRequest`
- `PositionDeleteRequest`
- `UserPositionUpdateRequest`

所有接口都需要补充 Swagger 注解，与现有用户、角色接口保持一致。

## 8. 关键业务规则

## 8.1 职位新增与编辑

- 新增、编辑前先校验租户存在
- 校验 `tenantId + code` 唯一
- `name`、`code` 必填并做长度限制
- `sort` 不允许小于 0
- `remark` 为空时统一存储为空字符串

## 8.2 用户绑定职位

- 用户不存在时直接报错
- 用户 `tenantId` 为空时禁止绑定，并返回明确错误
- 职位不存在时直接报错
- 传入的所有职位都必须属于该用户所在租户
- 禁用职位不可新增绑定
- 已绑定但后续被禁用的职位仍允许在界面中展示并移除

## 8.3 删除职位

- 删除前先校验职位存在
- 删除时自动删除 `userPosition` 中的关联记录
- 删除与解绑必须在同一个事务中执行

## 8.4 状态语义

- `status = 1` 表示启用
- `status = 0` 表示禁用
- 禁用不是删除
- 禁用职位仍可在列表中展示与编辑

## 9. 前端设计

## 9.1 路由与文件结构

新增以下文件：

- `admin-rsbuild/src/routes/system/position/index.tsx`
- `admin-rsbuild/src/routes/system/position/#PositionTable.tsx`
- `admin-rsbuild/src/routes/system/position/#CreatePositionForm.tsx`
- `admin-rsbuild/src/routes/system/position/#UpdatePositionForm.tsx`
- `admin-rsbuild/src/routes/system/position/#BatchUpdateForm.tsx`
- `admin-rsbuild/src/routes/system/user/#PositionDrawer.tsx`
- `admin-rsbuild/src/api/modules/position.ts`
- `admin-rsbuild/src/constants/queryKey/position.ts`

设计原则：

- 列表页使用 `KTable`
- 弹窗使用 `KModal`
- 工具栏按钮优先使用 `KTable.Button`
- 不手改 `routeTree.gen.ts`

## 9.2 职位管理页

页面路由：

- `/system/position/`

页面能力：

- 分页查询
- 按职位名称或编码搜索
- 按租户筛选
- 新增职位
- 编辑职位
- 启用/禁用
- 批量启用/禁用
- 删除职位

建议表格列：

- 职位信息
- 职位 ID
- 所属租户
- 排序
- 状态
- 操作

其中“职位信息”列采用聚合展示：

- 第一行：职位名称
- 第二行：职位编码
- 第三行：备注

新增与编辑表单字段保持与需求一致：

- 所属租户
- 职位名称
- 职位编码
- 排序
- 备注
- 状态

## 9.3 用户侧绑定职位

在现有用户管理表格操作列中新增按钮：

- `绑定职位`

打开抽屉或弹窗后采用双栏结构：

- 左侧：待添加职位
- 右侧：已绑定职位

交互规则：

- 若当前用户没有 `tenantId`，则不允许进入绑定流程，并直接提示原因
- 先查询当前用户 `tenantId` 下的全部职位
- 待添加列表只展示“未绑定且启用”的职位
- 已绑定列表需要展示禁用职位，并使用红色状态标识
- 已绑定禁用职位允许移除
- 保存时调用覆盖式接口更新

## 9.4 前端反馈文案

建议成功提示：

- `职位创建成功`
- `职位更新成功`
- `职位删除成功`
- `职位绑定成功`

建议删除确认文案：

`删除后将自动解除该职位与所有用户的绑定关系，且不可恢复，是否继续？`

## 10. 菜单与迁移设计

需要新增一条 Flyway 迁移，向系统管理菜单下插入：

- 路径：`/system/position`
- 标题：`职位管理`

菜单顺序建议放在用户管理之后、角色管理之前，原因如下：

- 职位与用户组织属性关联更强
- 与用户管理页中的“绑定职位”能力形成就近关系

## 11. 错误处理设计

建议返回语义：

| 场景 | 返回 |
| --- | --- |
| 职位不存在 | 404，`职位不存在` |
| 用户不存在 | 404，`用户不存在` |
| 租户不存在 | 400，`租户不存在` |
| 同租户编码重复 | 400，`该租户下职位编码已存在` |
| 跨租户绑定 | 400，`只能绑定同租户职位` |
| 批量状态更新传空 ID | 400，`职位 ID 不能为空` |

前端处理原则：

- 优先透传后端明确错误文案
- 不再额外包装模糊提示

## 12. 测试与验证范围

虽然当前协作约束中不要求执行命令验证，但实现阶段仍应覆盖以下关键路径：

1. 新增职位成功
2. 同租户重复编码新增失败
3. 编辑职位成功
4. 删除职位成功且关系自动清空
5. 用户绑定同租户职位成功
6. 用户绑定跨租户职位失败
7. 禁用职位不可新增绑定
8. 已绑定禁用职位可见且可移除

建议验证组合：

- 后端服务层校验逻辑验证
- 关键接口冒烟验证
- 前端关键路径人工验证
- Flyway 建表与菜单迁移检查

## 13. 实施拆分建议

建议后续实现按以下顺序推进：

1. 数据迁移：新增 `position`、`userPosition` 表与菜单迁移
2. 后端建模：domain、mapper、request、response、service、controller
3. 前端 API 与 query key
4. 职位管理页
5. 用户页“绑定职位”
6. 回归关键路径与文案收尾

## 14. 风险与限制

- 当前系统中的用户与角色绑定走 Casbin，而职位绑定改为业务表，后续实现时需要明确边界，避免误复用权限服务
- 用户页绑定职位依赖租户信息完整，若历史用户存在空租户数据，需要在实现时明确兜底或禁止绑定
- 删除职位为物理删除，不保留历史追溯能力；若未来需要审计，应单独设计变更日志能力

## 15. 结论

本次职位功能采用“独立职位表 + 独立用户职位关系表”的方案，在 `mod-auth` 中完成后端实现，在系统管理下新增职位管理页，并在用户管理页补充“绑定职位”能力。

该方案满足以下目标：

- 保持职位与角色职责分离
- 符合多租户隔离要求
- 支持用户与职位多对多绑定
- 满足物理删除并自动清空绑定关系的业务要求
- 最大化复用当前系统管理模块的既有实现模式
