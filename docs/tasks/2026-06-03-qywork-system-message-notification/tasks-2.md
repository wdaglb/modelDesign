# 任务 2：实现企业微信应用消息客户端与 Markdown 内容组装

## 来源方案

- 方案文件：`docs/plans/2026-06-03-qywork-system-message-notification.md`
- 对应方案段落：`4.4 Markdown 消息内容`、`4.5 企业微信客户端`

## 目标

- 封装企业微信 `message/send` 应用消息接口。
- 支持发送 `markdown` 类型应用消息。
- 提供系统消息到企业微信 Markdown 内容的稳定组装逻辑。

## 实施范围

- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/client/`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/service/`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/configuration/`
- `modelDesign/mod-third-party/mod-third-party-biz/src/test/java/io/github/modelDesign/thirdparty/qywork/`

## 依赖关系

- 前置任务：无
- 可并行任务：`tasks-1.md`
- 并行限制：本任务只实现企业微信客户端和内容组装，不接入系统消息 provider。

## 执行步骤

1. 增加企业微信应用消息请求模型，字段至少覆盖 `touser`、`msgtype`、
   `agentid`、`markdown.content`。
2. 增加企业微信应用消息响应模型，字段至少覆盖 `errcode`、`errmsg` 和文档中
   用于排查无效接收人的返回字段。
3. 增加企业微信消息发送客户端，调用
   `POST /cgi-bin/message/send?access_token={accessToken}`。
4. 校验 `errcode = 0` 为成功；非 0 时抛出可被上层重试链路捕获的异常。
5. 增加 Markdown 内容组装逻辑，支持标题、正文和可选跳转地址。
6. 处理 Markdown 特殊字符、空白内容和长度截断，避免用户输入破坏消息结构。
7. 同步维护新增类和公共方法的 `/** */` 注释。

## 验证方式

- 单测覆盖成功响应、失败响应、无跳转地址、有跳转地址和内容截断。
- 后续由 `tasks-4.md` 统一运行目标测试。

## 风险与回退

- 风险：企业微信 Markdown 展示规则与普通 Markdown 存在差异。
- 回退：保留客户端，暂时让 provider 不调用该客户端，或降级到纯文本内容。

## 完成标准

- 企业微信消息客户端可独立构造并发送 `markdown` 应用消息。
- 非 0 `errcode` 会携带企业微信错误信息抛出。
- Markdown 内容组装逻辑可被 provider 复用并有单测覆盖。
