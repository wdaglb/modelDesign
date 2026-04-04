# 企业微信网页授权绑定设计

## 1. 目标与结论

### 1.1 目标
- 为当前系统增加“已登录用户绑定企业微信账号”的能力。
- 优先打通个人中心中的企业微信绑定闭环，不改动现有账号密码登录主链路。
- 同时为后续接入微信开放平台、飞书等第三方平台预留统一的 OAuth 绑定模型。

### 1.2 已确认结论
- 本次优先场景采用 `1B`：用户先登录系统，再在个人中心绑定企业微信。
- 绑定主标识采用 `2A`：企业微信 `UserId`。
- 冲突规则采用 `3A`：同租户下，同一个企业微信 `UserId` 只能绑定一个系统账号，若已被其他账号绑定则直接失败。
- 使用环境采用“企微内直接授权 + 外部浏览器展示二维码，由手机企业微信扫码完成绑定”的双入口策略。
- 永久绑定关系统一设计为 `user_oauth`，不为企业微信单独建专用绑定表。
- 绑定短会话统一设计为 Redis `oauth_binding_session`，并保留多平台复用能力。

## 2. 范围与非目标

### 2.1 本次范围
- 在个人中心第三方账号页签中开放企业微信绑定入口。
- 支持企业微信内直接发起网页授权绑定。
- 支持外部浏览器展示二维码，用户使用手机企业微信扫码后完成授权绑定。
- 新增当前登录用户的企业微信绑定状态查询能力。
- 新增企业微信绑定结果页或结果态展示。
- 扩展租户级企业微信配置，补齐网页授权落地所需的 `agentId` 等信息。
- 新增通用 `user_oauth` 永久绑定模型与 Redis 短会话模型。

### 2.2 非目标
- 不实现企业微信免登录。
- 不改造现有密码登录逻辑。
- 不做企业微信通讯录同步、部门同步、昵称头像自动回填。
- 不实现多平台统一 SDK 工厂、插件注册中心或策略引擎。
- 不实现 WebSocket 实时推送桌面端绑定状态，首版使用轮询。
- 不实现复杂解绑审批、换绑审核、多应用切换能力。

## 3. 现状摘要

### 3.1 已有前端能力
- 登录主链路已经存在，`[loginService.ts](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/service/loginService.ts)` 与 `[auth.ts](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/store/auth.ts)` 负责 token 初始化、登录跳转与过期处理。
- 登录页已完成较完整的面板编排，但当前仅支持密码登录，企业微信扫码区域仍是展示级占位。
- 个人中心第三方账号页签 `[ThirdPartyTab.tsx](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/routes/personal-center/#ThirdPartyTab.tsx)` 已预留企业微信卡片，但当前只展示“即将支持”。
- 系统管理中已有企业微信配置页 `[index.tsx](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/routes/system/third-party/qywork/index.tsx)`，当前仅维护 `corpId`、`corpSecret`、`remark`。

### 3.2 已有接口能力
- 前端已有企业微信配置接口封装 `[qywork.ts](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/api/modules/qywork.ts)`：
  - `GET /third-party/qywork/config/current`
  - `POST /third-party/qywork/config/save`
- 当前尚无：
  - 当前用户企业微信绑定状态接口
  - OAuth 绑定会话接口
  - 扫码中转与授权回调接口

### 3.3 当前痛点
- 租户虽已能配置 `corpId/corpSecret`，但尚未形成实际授权闭环。
- 个人中心无法查看真实绑定状态，也无法发起绑定。
- 外部浏览器场景下，没有从桌面端引导到手机企业微信完成绑定的方案。
- 如果直接按“企业微信单平台特化”设计，后续接入其它第三方平台会重复造轮子。

## 4. 方案对比

| 方案 | 说明 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- | --- |
| A. 前端发起绑定，后端控制授权与回调，前端展示结果 | 个人中心点击绑定后请求后端创建会话；企微内直接跳 OAuth，外部浏览器展示二维码；回调后前端轮询结果 | 最贴合现有前后端分离结构；前端状态展示完整；方便扩展解绑、其它平台 | 需要新增会话、结果页、轮询逻辑 | 采用 |
| B. 后端直回调直绑定，再 302 回个人中心 | 授权从后端出发，回调后后端直接做完绑定再跳回前端 | 安全边界集中；前端更轻 | 前端可视状态弱；桌面二维码流与结果回显较绕 | 不采用 |
| C. 弹窗或新窗口授权 | 个人中心弹窗打开授权页，完成后关闭并刷新 | 桌面端看似顺手 | 企微内 H5 稳定性差，移动端体验差，窗口控制复杂 | 不采用 |

最终采用方案 A，并在数据层做“通用 OAuth 绑定模型”抽象，业务实现先只落企业微信 provider。

## 5. 最终整体设计

### 5.1 总体原则
- 这次只做“当前登录用户绑定企业微信”。
- 现有登录体系保持不变，企业微信先作为第三方身份绑定源，而不是登录入口。
- 永久绑定关系通用化，短期会话通用化，企业微信实现单独落地。
- 所有 OAuth 安全控制统一由后端负责，前端不直接拼接关键授权参数。

### 5.2 系统拆分

#### 5.2.1 租户企业微信配置
现有配置页继续承担租户级配置维护职责，但需要从“仅 access_token 基础配置”扩展到“可支持网页授权”的完整配置：
- `corpId`
- `corpSecret`
- `agentId`
- `enabled`
- 回调地址说明
- 可信域名/授权域名配置提示

设计意图：
- 让管理员知道“保存配置”和“真正可发起网页授权”之间还有企业微信后台配置要求。
- 在发起绑定前即可判断当前租户配置是否完整，避免把错误推迟到回调阶段才暴露。

#### 5.2.2 个人中心绑定入口
个人中心第三方账号页签中的企业微信卡片从占位状态升级为真实功能入口，承担三件事：
- 展示当前绑定状态
- 发起绑定
- 展示绑定结果与失败原因

入口点击后的环境分流：
- 若在企业微信客户端内打开，直接走 OAuth 授权。
- 若在外部浏览器打开，展示二维码，由手机企业微信扫码进入绑定流程。

#### 5.2.3 绑定短会话
无论是企微内直连授权，还是桌面浏览器二维码扫码，都统一围绕一次 `oauth_binding_session` 运转。该会话记录：
- 谁发起了绑定
- 面向哪个平台和哪个平台应用
- 当前会话状态
- 与二维码、OAuth `state` 对应的短期令牌

设计意图：
- 保证桌面端、手机端、企业微信回调三条链路共享同一上下文。
- 让前端能通过轮询会话状态判断绑定是否完成，而不必依赖不稳定的跨端跳转。

#### 5.2.4 永久绑定关系
绑定成功后，把系统用户与企业微信身份写入通用 `user_oauth` 表。企业微信在该模型中的映射为：
- `provider = qywork`
- `providerAppId = corpId:agentId`
- `providerUserId = UserId`

### 5.3 核心用户流

#### 5.3.1 企业微信内直接绑定流
1. 用户已登录系统，进入个人中心第三方账号页签。
2. 点击“绑定企业微信”。
3. 前端请求后端创建绑定会话。
4. 后端校验租户配置和当前用户状态，返回 `sessionId` 与 `authUrl`。
5. 前端跳转到企业微信 OAuth 地址。
6. 企业微信授权后回调系统。
7. 后端用 `code` 换取企业微信成员身份，得到 `UserId`。
8. 后端执行冲突校验并写入 `user_oauth`。
9. 会话状态改为 `success`，前端回到结果页并刷新绑定状态。

#### 5.3.2 外部浏览器二维码绑定流
1. 用户已登录系统，进入个人中心第三方账号页签。
2. 点击“绑定企业微信”。
3. 前端识别当前不在企业微信环境。
4. 前端请求后端创建绑定会话。
5. 后端返回 `sessionId`、二维码内容地址与过期时间。
6. 页面展示二维码、倒计时和轮询中的状态提示。
7. 用户使用手机企业微信扫描二维码。
8. 手机端进入系统扫码中转页，再跳转企业微信 OAuth 授权。
9. 用户在手机端完成授权。
10. 后端处理回调、完成绑定并更新会话状态。
11. 桌面端轮询到 `success` 后结束轮询并刷新当前绑定状态。

### 5.4 推荐的最小闭环
首版必须完成：
- 查看当前绑定状态
- 企微内直接绑定
- 外部浏览器二维码扫码绑定
- 绑定冲突拦截
- 成功、失败、过期结果展示

首版明确不做：
- 企业微信免登录
- 通讯录同步
- WebSocket 推送绑定完成
- 多平台实际落地，只保留数据与接口层的通用化预留

## 6. 数据模型设计

### 6.1 总体策略
- **长期状态入库**：租户配置、用户绑定关系。
- **短期流程入 Redis**：二维码会话、OAuth state、授权中间态。
- **数据结构通用化**：兼容后续其它第三方平台。
- **业务实现聚焦企业微信**：第一版只实现 `provider = qywork`。

### 6.2 永久绑定表 `user_oauth`

#### 6.2.1 表设计目标
`user_oauth` 不只服务企业微信，而是作为统一的第三方绑定关系表，为未来接入微信开放平台、飞书等保留字段空间。

#### 6.2.2 建议字段

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `tenant_id` | 租户 ID |
| `user_id` | 系统用户 ID |
| `provider` | 平台标识，如 `qywork` / `wechat_open` / `feishu` |
| `provider_app_id` | 第三方应用标识；企业微信建议存 `corpId:agentId` |
| `provider_user_id` | 第三方用户主标识；企业微信对应 `UserId` |
| `provider_union_id` | 预留统一身份标识 |
| `provider_open_id` | 预留开放平台用户标识 |
| `nickname` | 第三方侧昵称，预留 |
| `avatar` | 第三方侧头像，预留 |
| `extra_json` | 额外原始字段，预留扩展能力 |
| `bind_source` | `in_app` / `qr_scan` |
| `status` | `bound` / `unbound` / `disabled` |
| `bound_at` | 首次绑定时间 |
| `last_auth_at` | 最近一次授权成功时间 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

#### 6.2.3 唯一性约束
- `unique(tenant_id, user_id, provider)`
  - 同一租户下，一个系统用户对同一平台只保留一条有效绑定。
- `unique(tenant_id, provider, provider_app_id, provider_user_id)`
  - 同一租户下，同一平台、同一应用内的同一第三方身份只能绑定一个系统账号。

这样可自然满足本次业务约束：同租户内同一个企业微信 `UserId` 不允许绑定多个系统账号。

### 6.3 短会话 Redis `oauth_binding_session`

#### 6.3.1 设计原因
绑定会话是短生命周期数据，且会频繁变更状态，不适合首版直接落数据库。Redis 更适合承担：
- 二维码 token 管理
- OAuth `state` 校验
- 轮询状态共享
- 过期淘汰

#### 6.3.2 Key 设计
- `oauth:binding:session:{sessionId}`
- `oauth:binding:scene:{sceneToken}`

必要时也可补一个 `oauth:binding:state:{stateToken}` 的映射层，但第一版建议把 `stateToken` 合并进 session 数据，不再额外拆 key。

#### 6.3.3 Value 结构

| 字段 | 说明 |
| --- | --- |
| `sessionId` | 会话 ID |
| `tenantId` | 租户 ID |
| `userId` | 发起绑定的系统用户 |
| `provider` | 平台标识，如 `qywork` |
| `providerAppId` | 平台应用标识 |
| `entryMode` | `in_app` / `desktop_qr` |
| `sceneToken` | 二维码短期 token |
| `stateToken` | OAuth state |
| `status` | `pending` / `authorizing` / `binding` / `success` / `failed` / `expired` / `cancelled` |
| `result` | 成功时的摘要信息 |
| `failCode` | 失败码 |
| `failMessage` | 失败原因 |
| `expireAt` | 过期时间 |
| `createdAt` | 创建时间 |

#### 6.3.4 TTL 建议
- 会话默认有效期：`5~10 分钟`
- 成功或失败后继续保留：`1~3 分钟`

设计意图：
- 二维码不过期过久，降低被转发滥用的风险。
- 结果状态不会刚写入就立刻消失，给桌面端轮询留出缓冲时间。

### 6.4 租户级企业微信配置
当前已有企业微信配置页面，但为支持网页授权，需要扩展为“可校验是否具备授权能力”的配置模型。建议至少包含：
- `corpId`
- `corpSecret`
- `agentId`
- `enabled`
- `remark`

是否单独抽象为 `third_party_config`，本次不强制推进。若后端当前已有企业微信配置模型，则首版可继续沿用 `qywork_config`，避免同时启动两层抽象改造。

## 7. 状态机与失败码设计

### 7.1 会话状态机

| 状态 | 含义 |
| --- | --- |
| `pending` | 会话已创建，等待扫码或等待授权跳转 |
| `authorizing` | 用户已进入授权流程 |
| `binding` | 后端正在换取身份并写入绑定关系 |
| `success` | 绑定成功 |
| `failed` | 绑定失败 |
| `expired` | 会话已过期 |
| `cancelled` | 用户主动取消或流程被终止 |

### 7.2 失败码建议

| 失败码 | 含义 | 前端提示建议 |
| --- | --- | --- |
| `TENANT_CONFIG_MISSING` | 租户未完成企业微信配置 | 请联系管理员完成企业微信配置后重试 |
| `TENANT_CONFIG_DISABLED` | 当前租户企业微信配置已停用 | 当前租户企业微信配置未启用 |
| `SESSION_EXPIRED` | 绑定会话已过期 | 二维码已过期，请重新发起绑定 |
| `STATE_INVALID` | OAuth state 不合法或已失效 | 授权校验失败，请重新操作 |
| `QYWORK_CODE_INVALID` | 企业微信回调 code 无效或已过期 | 授权已失效，请重新扫码 |
| `QYWORK_USER_NOT_FOUND` | 未取到企业微信成员身份 | 未识别到企业微信成员，请确认应用可见范围 |
| `QYWORK_USER_CONFLICT` | 企业微信身份已绑定其他系统账号 | 当前企业微信账号已绑定其他系统用户 |
| `SYSTEM_USER_MISMATCH` | 回调上下文与发起绑定用户不匹配 | 绑定上下文已失效，请重新操作 |
| `UNKNOWN_ERROR` | 未知异常 | 绑定失败，请稍后重试 |

## 8. 接口设计

### 8.1 设计原则
- 路由层做 provider 维度的通用化。
- 第一版实际只实现 `provider = qywork`。
- 前端永远只和本系统后端交互，不直接在浏览器中拼接企业微信敏感授权参数。

### 8.2 建议接口

| 接口 | 用途 |
| --- | --- |
| `GET /third-party/qywork/config/current` | 查询当前租户企业微信配置 |
| `POST /third-party/qywork/config/save` | 保存当前租户企业微信配置 |
| `GET /third-party/{provider}/binding/current` | 查询当前登录用户在指定平台的绑定状态 |
| `POST /third-party/{provider}/binding/session` | 创建绑定会话，返回授权地址或二维码内容 |
| `GET /third-party/{provider}/binding/session/{sessionId}` | 查询绑定会话状态 |
| `GET /third-party/{provider}/binding/scan-entry` | 手机扫码后的中转入口 |
| `GET /third-party/{provider}/oauth/callback` | 第三方 OAuth 回调入口 |
| `POST /third-party/{provider}/binding/unbind` | 解绑接口，第一版可只预留不实现 |

### 8.3 `POST /binding/session` 返回建议

| 字段 | 说明 |
| --- | --- |
| `sessionId` | 当前绑定会话 ID |
| `entryMode` | `in_app` / `desktop_qr` |
| `authUrl` | 企业微信内直接跳转的授权地址 |
| `qrCodeUrl` | 桌面端用于生成二维码的内容地址 |
| `expireAt` | 过期时间 |
| `pollIntervalMs` | 建议前端轮询间隔 |

设计意图：
- 企微内场景直接跳 `authUrl`。
- 外部浏览器直接渲染 `qrCodeUrl`。
- 所有前端状态更新统一围绕 `sessionId` 轮询。

### 8.4 绑定状态查询返回建议
`GET /third-party/{provider}/binding/current` 建议返回：
- 是否已绑定
- `provider`
- `providerUserId`
- `bindSource`
- `boundAt`
- 当前租户配置是否完整
- 是否允许发起绑定

这样个人中心卡片就能同时展示“当前绑定状态”和“当前是否具备发起绑定的条件”。

## 9. 前端设计

### 9.1 个人中心第三方账号页签
当前 `[ThirdPartyTab.tsx](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/routes/personal-center/#ThirdPartyTab.tsx)` 中的企业微信卡片需要从展示级占位升级为真实功能卡片：
- 展示当前绑定状态
- 根据是否已绑定切换按钮文案
- 当租户配置不完整时展示阻断提示
- 点击后按环境分流到授权或二维码面板

### 9.2 外部浏览器二维码面板
建议新增独立的二维码绑定面板，而不是把全部逻辑塞回卡片本身。该面板负责：
- 展示二维码
- 展示会话倒计时
- 轮询会话状态
- 在成功、失败、过期时给出明确结果

必要时可做成一个复用组件，后续给其它第三方扫码绑定场景共用。

### 9.3 绑定结果页或结果态
无论是企微内绑定，还是桌面端扫码，前端都需要一个统一结果承接点，用于处理：
- 成功
- 冲突
- 会话过期
- 租户配置不完整
- 其它未知失败

这样可以避免把所有错误都堆在个人中心按钮旁边，提升可读性和可排障性。

### 9.4 企业微信配置页
当前 `[index.tsx](/Users/wanz/web/wwwroot/modelDesign/admin-rsbuild/src/routes/system/third-party/qywork/index.tsx)` 需要补充：
- `agentId` 字段
- 配置完整度提示
- 授权回调域名与可信域名说明

若继续保留当前“corpSecret 可明文回显”的实现，需要在交付时明确告知安全风险；更稳的方向是后端不回显完整 secret，但这不属于本设计的强制范围。

## 10. 后端设计

### 10.1 绑定会话创建
创建会话时，后端必须先完成以下校验：
- 当前登录用户存在
- 当前租户存在且允许使用企业微信
- 企业微信配置完整：`corpId`、`corpSecret`、`agentId`、`enabled`
- 当前用户在该 provider 下尚未存在有效绑定

然后再生成：
- `sessionId`
- `sceneToken`
- `stateToken`
- `authUrl`
- `qrCodeUrl`

### 10.2 扫码中转页
二维码不应直接指向最终企业微信 OAuth 地址，而应先指向系统自己的 `scan-entry`。这样做有几个目的：
- 能把二维码与当前 `sessionId` 重新建立关联
- 可以在手机端做参数补齐与过期判断
- 若二维码失效，可直接在中转页给出明确提示，而不是把用户送到不可理解的第三方错误页

### 10.3 OAuth 回调处理
回调处理流程建议固定为：
1. 校验 `stateToken`
2. 从 Redis 取回绑定会话
3. 校验会话未过期、未完成、未失效
4. 调企业微信接口换取成员身份
5. 提取 `UserId`
6. 执行同租户唯一绑定校验
7. 写入或更新 `user_oauth`
8. 更新会话状态为 `success` 或 `failed`
9. 返回结果页或跳转结果页

### 10.4 幂等与重复回调
OAuth 回调必须按“单会话只成功一次”的原则处理：
- 已经进入 `success` 的会话，后续重复回调直接视为失效
- 已经进入 `failed`、`expired`、`cancelled` 的会话，不再重试写库
- 写库前应再次检查唯一性，避免竞态条件下串绑

## 11. 安全策略

### 11.1 OAuth 安全
- `stateToken` 必须由后端生成，不能由前端自造。
- `stateToken` 必须与 `sessionId` 一一对应。
- 成功或失败终态后，该 `stateToken` 立即失效，防止重放。

### 11.2 跨端一致性
- 桌面二维码、手机扫码中转页、OAuth 回调、桌面轮询都必须以同一个 `sessionId` 作为主线。
- 会话内必须保留 `tenantId`、`userId`、`provider`、`providerAppId`，防止跨租户、跨用户串绑。

### 11.3 二维码安全
- 二维码仅承载短期 `sceneToken`，不直接暴露完整业务上下文。
- 会话 TTL 到期后，二维码必须失效。
- 扫码中转页进入后再次检查会话有效期，避免过期二维码仍能继续授权。

### 11.4 数据最小暴露
- 前端只展示必要的绑定结果字段，不直接透传第三方原始返回。
- `extra_json` 仅作为后端留痕与排障字段，不默认向前端暴露。

## 12. 测试与验证策略

### 12.1 后端验证重点
- `state` 校验逻辑
- 会话过期判断
- `UserId` 冲突判断
- 重复回调幂等
- 配置缺失时的阻断逻辑

### 12.2 前端验证重点
- 未绑定状态展示
- 已绑定状态展示
- 租户配置缺失时的阻断提示
- 外部浏览器二维码展示与倒计时
- 轮询成功、失败、过期三类结果

### 12.3 最少必须跑通的关键路径
1. 企业微信内直接绑定成功。
2. 外部浏览器二维码扫码绑定成功。
3. 同租户内 `UserId` 已绑定其他账号时正确失败。
4. 二维码过期后前后端都能提示重新发起。
5. 企业微信配置缺失时不允许创建绑定会话。

## 13. 上线要求与运维建议

### 13.1 上线前检查项
1. 企业微信应用已创建并确认可见范围。
2. `corpId`、`corpSecret`、`agentId` 已完成配置。
3. 企业微信后台已配置授权回调域名与可信域名。
4. Redis 在目标环境中可用，并设置合理过期策略。
5. 手机扫码进入的页面已验证移动端可用。
6. 生产日志中可按 `sessionId` 检索整条绑定链路。

### 13.2 建议日志字段
- `sessionId`
- `tenantId`
- `userId`
- `provider`
- `providerAppId`
- `failCode`
- `providerUserId`
- `stateToken` 摘要
- `sceneToken` 摘要

## 14. 第一版交付边界

### 14.1 本次交付完成后，用户应能做到
- 在个人中心看到企业微信是否已绑定。
- 在企业微信内直接完成绑定。
- 在桌面浏览器中看到二维码，并通过手机企业微信扫码完成绑定。
- 在绑定冲突、二维码过期、配置缺失等情况下看到明确反馈。

### 14.2 本次交付完成后，系统应具备
- `user_oauth` 通用绑定模型
- Redis `oauth_binding_session` 通用短会话模型
- 企业微信 provider 的完整绑定实现
- 为后续其它第三方平台接入保留的数据与接口骨架

### 14.3 本次交付完成后，系统仍不具备
- 企业微信登录
- 企业微信通讯录同步
- 多平台统一运行时框架
- 实时消息推送式的跨端完成通知

## 15. 参考与说明
- 企业微信网页授权设计参考用户提供的官方文档入口：`https://developer.work.weixin.qq.com/document/path/91335`
- 本设计中涉及的 OAuth 参数、二维码与域名约束，按企业微信网页授权的一般规则组织；具体接口字段名与回调限制在实现阶段应再次对照官方文档逐项核实。
