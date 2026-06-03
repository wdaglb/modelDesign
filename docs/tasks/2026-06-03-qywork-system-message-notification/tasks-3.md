# 任务 3：实现企业微信系统消息 provider

## 来源方案

- 方案文件：`docs/plans/2026-06-03-qywork-system-message-notification.md`
- 对应方案段落：`4.3 企业微信 Provider`、`5. 失败处理`

## 目标

- 新增企业微信系统消息 provider，编码为 `qywork`。
- 已绑定企业微信用户收到企业微信应用消息。
- 未绑定用户跳过企业微信推送，不影响站内消息和其它 provider。

## 实施范围

- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/service/UserOauthService.java`
- `modelDesign/mod-system/mod-system-api/src/main/java/io/github/modelDesign/system/api/`
- 必要时可只读参考：
  `modelDesign/mod-system/mod-system-biz/src/main/java/io/github/modelDesign/system/service/systemMessage/`

## 依赖关系

- 前置任务：`tasks-1.md`、`tasks-2.md`
- 可并行任务：无
- 并行限制：本任务依赖 provider 契约和企业微信客户端产物，必须在前置任务完成后执行。

## 执行步骤

1. 新增企业微信系统消息 provider，实现或包装 `SystemMessagePushAdapter`。
2. provider 编码固定为 `qywork`，并通过 Spring Bean 注册到现有注册表。
3. 从 `SystemMessagePushContext` 读取租户、接收用户、标题、正文和跳转地址。
4. 按租户和用户 ID 查询 `provider = qywork` 的有效绑定。
5. 未绑定时直接返回，并记录必要日志；不得抛出会触发重试的异常。
6. 已绑定时获取当前租户企业微信配置和 access token。
7. 调用 `tasks-2.md` 产出的客户端发送 `markdown` 应用消息。
8. 企业微信配置缺失、access token 获取失败、接口返回失败时抛出异常，
   由现有推送任务重试机制处理。
9. 同步维护新增 provider、方法和风险点的 `/** */` 注释。

## 验证方式

- 单测覆盖未绑定跳过、已绑定发送、配置失败、接口失败。
- 后续由 `tasks-4.md` 统一运行目标测试。

## 风险与回退

- 风险：绑定表中的 `providerUserId` 与企业微信应用消息 `touser` 不一致时会发送失败。
- 回退：从默认 provider 策略移除 `qywork`，保留 provider 代码用于排查和后续修正。

## 完成标准

- `qywork` provider 可被系统消息推送注册表发现。
- 已绑定用户会触发企业微信应用消息发送。
- 未绑定用户不会影响站内消息和其它 provider。
