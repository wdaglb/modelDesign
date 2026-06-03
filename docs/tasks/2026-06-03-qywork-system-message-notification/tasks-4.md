# 任务 4：补齐单元测试与验证收口

## 来源方案

- 方案文件：`docs/plans/2026-06-03-qywork-system-message-notification.md`
- 对应方案段落：`8. 测试范围`

## 目标

- 用单元测试覆盖默认 provider 策略、企业微信客户端、企业微信 provider 和渠道隔离。
- 按后端聚合入口运行目标测试，确认主路径可验证。

## 实施范围

- `modelDesign/mod-system/mod-system-biz/src/test/java/`
- `modelDesign/mod-third-party/mod-third-party-biz/src/test/java/`
- 必要时只读参考被测生产代码。

## 依赖关系

- 前置任务：`tasks-1.md`、`tasks-2.md`、`tasks-3.md`
- 可并行任务：无
- 并行限制：本任务依赖前三个任务的生产代码产物，必须串行收口。

## 执行步骤

1. 为 `SystemMessagePublishService` 补测试，覆盖默认补入 `qywork` provider。
2. 覆盖显式传入 `qywork` 时不重复创建推送任务。
3. 为企业微信消息客户端补测试，覆盖 `errcode = 0` 和非 0 `errcode`。
4. 为 Markdown 内容组装补测试，覆盖有跳转地址、无跳转地址和内容截断。
5. 为企业微信 provider 补测试，覆盖未绑定跳过和已绑定发送。
6. 增加多 provider 隔离测试，证明企业微信 provider 失败不影响其它 provider 任务。
7. 按目标测试命令运行验证；若 reactor 后续出现非目标模块既有问题，单独记录。

## 验证方式

```bash
./mvnw -pl boot -am -Dtest=SystemMessagePublishServiceTest,QyworkSystemMessagePushAdapterTest \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

如果测试类实际命名不同，应按最终新增测试类名调整 `-Dtest`，但仍以 `boot`
聚合入口执行。

## 风险与回退

- 风险：现有测试基础设施可能缺少部分 Bean 或 mock，需要补测试装配。
- 回退：保留生产代码，先将复杂 Spring 装配测试降级为纯单元测试，记录未覆盖项。

## 完成标准

- 默认 provider 策略、企业微信客户端、企业微信 provider 和渠道隔离均有测试覆盖。
- 目标测试命令完成，或明确记录非本次改动导致的既有阻塞。
