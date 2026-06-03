# 任务 1：补齐系统消息 provider 隔离与默认策略

## 来源方案

- 方案文件：`docs/plans/2026-06-03-qywork-system-message-notification.md`
- 对应方案段落：`4.1 默认推送策略`、`4.2 推送渠道 Provider 设计`

## 目标

- 系统消息推送渠道按 provider 独立调度。
- 默认系统消息发布自动包含企业微信 provider。
- 显式传入 provider 编码时不重复创建企业微信推送任务。

## 实施范围

- `modelDesign/mod-system/mod-system-api/src/main/java/io/github/modelDesign/system/api/`
- `modelDesign/mod-system/mod-system-api/src/main/java/io/github/modelDesign/system/api/dto/`
- `modelDesign/mod-system/mod-system-biz/src/main/java/io/github/modelDesign/system/service/systemMessage/`
- `modelDesign/mod-system/mod-system-biz/src/main/java/io/github/modelDesign/system/queue/systemMessage/`

## 依赖关系

- 前置任务：无
- 可并行任务：`tasks-2.md`
- 并行限制：本任务只处理系统消息 provider 契约和默认策略；不得实现企业微信
  HTTP 客户端或企业微信 provider 发送逻辑。

## 执行步骤

1. 评估现有 `SystemMessagePushAdapter` 是否直接作为 provider 接口使用。
2. 如需增加更语义化命名，优先用兼容包装，不破坏已有适配器注册逻辑。
3. 在系统消息发布时补齐默认 provider 编码，默认包含 `qywork`。
4. 处理显式传入 provider 编码的去重逻辑，避免同一消息创建重复推送任务。
5. 确认每个 provider 对应独立 `SystemMessagePushTask`，单个 provider 失败不影响
   其它 provider 任务创建。
6. 同步维护相关类、接口和公共方法的 `/** */` 注释。

## 验证方式

- 静态检查默认 provider 合并与去重逻辑。
- 后续由 `tasks-4.md` 补充并运行单元测试。

## 风险与回退

- 风险：默认追加企业微信 provider 会扩大系统消息推送任务数量。
- 回退：移除默认 provider 编码补入逻辑，保留 provider 契约不影响站内消息。

## 完成标准

- 系统消息发布默认会为企业微信 provider 创建推送任务。
- 显式传入 `qywork` 时不会重复创建企业微信推送任务。
- provider 任务之间仍保持独立状态与独立重试。
