# 企业微信网页授权绑定 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动现有密码登录主链路的前提下，为个人中心落地企业微信网页授权绑定，支持企微内直接授权与外部浏览器二维码扫码绑定。

**Architecture:** 后端在 `mod-third-party` 中补齐企业微信配置、OAuth 用户信息换取、通用 `user_oauth` 绑定关系和 Redis `oauth_binding_session`，由后端统一生成授权 URL、维护 `state` 与扫码会话。前端在个人中心页签中接入绑定状态卡片、二维码面板和结果轮询，并扩展企业微信配置页的 `agentId` / `enabled` 字段。验证以 TDD 为主：先补纯逻辑与界面行为测试，再写最小实现使其通过。

**Tech Stack:** Spring Boot 3、MyBatis-Plus、RedisTemplate、Flyway、React 18、TypeScript、TanStack Router、TanStack Query、Ant Design、Vitest、Testing Library

---

## 文件结构与职责

### 后端新增文件
- `modelDesign/boot/src/main/resources/db/migration/V1.20260404143000__mod_third_party_user_oauth.sql`
  - 新增 `userOauth` 表并补充 `qyworkCorpConfig` 的 `agentId`、`enabled` 字段。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/domain/UserOauth.java`
  - 通用第三方用户绑定实体。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/mapper/UserOauthMapper.java`
  - `user_oauth` Mapper。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/enums/OauthProvider.java`
  - provider 枚举，首版只包含 `QYWORK`。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/enums/OauthBindSource.java`
  - 绑定来源枚举：`IN_APP`、`QR_SCAN`。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/enums/OauthBindingSessionStatus.java`
  - 绑定会话状态枚举。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/model/OauthBindingSession.java`
  - Redis 中存储的一次绑定会话对象。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/model/OauthBindingSessionResult.java`
  - 绑定成功时返回给前端的摘要结果。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/request/CreateOauthBindingSessionRequest.java`
  - 前端创建绑定会话请求体。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/response/UserOauthBindingStatusVo.java`
  - 当前用户绑定状态视图。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/response/OauthBindingSessionCreatedVo.java`
  - 创建会话响应。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/response/OauthBindingSessionStatusVo.java`
  - 查询会话状态响应。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/service/OauthBindingSessionService.java`
  - Redis 绑定会话读写、过期与状态流转。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/service/UserOauthService.java`
  - 通用绑定关系服务。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/client/QyworkOauthClient.java`
  - 企业微信 OAuth `code -> UserId` 客户端。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/client/QyworkOauthUserInfoResponse.java`
  - 企业微信 OAuth 用户信息响应对象。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/service/QyworkOauthService.java`
  - 生成授权 URL、创建会话、处理扫码入口与回调。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/controller/QyworkBindingController.java`
  - 绑定状态、创建会话、查询会话、扫码中转接口。
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/controller/QyworkOauthController.java`
  - OAuth 回调接口。
- `modelDesign/mod-third-party/mod-third-party-biz/src/test/java/io/github/modelDesign/thirdparty/oauth/service/OauthBindingSessionServiceTest.java`
  - 绑定会话服务单测。
- `modelDesign/mod-third-party/mod-third-party-biz/src/test/java/io/github/modelDesign/thirdparty/qywork/service/QyworkOauthServiceTest.java`
  - 企业微信 OAuth 服务的纯逻辑单测。

### 后端修改文件
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/domain/QyworkCorpConfig.java`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/request/QyworkConfigSaveRequest.java`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/response/QyworkConfigVo.java`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/service/QyworkCorpConfigService.java`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/configuration/QyworkProperties.java`
- `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/qywork/service/QyworkTokenCacheService.java`
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthWebMvcConfigurer.java`
- `modelDesign/boot/src/main/resources/application.yaml`

### 前端新增文件
- `admin-rsbuild/src/routes/personal-center/#QyworkBindingPanel.tsx`
  - 二维码绑定面板与轮询逻辑。
- `admin-rsbuild/src/routes/personal-center/#qyworkBinding.helper.ts`
  - 环境识别、结果文案与状态格式化纯函数。
- `admin-rsbuild/src/routes/personal-center/__tests__/ThirdPartyTab.test.tsx`
  - 第三方账号页签交互测试。
- `admin-rsbuild/src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts`
  - 纯函数测试。

### 前端修改文件
- `admin-rsbuild/src/api/modules/qywork.ts`
- `admin-rsbuild/src/constants/queryKey/qywork.ts`
- `admin-rsbuild/src/routes/system/third-party/qywork/index.tsx`
- `admin-rsbuild/src/routes/personal-center/#ThirdPartyTab.tsx`
- `admin-rsbuild/src/api/index.ts`

## Task 1: 先锁定前端绑定状态与环境分流纯逻辑（TDD）

**Files:**
- Create: `admin-rsbuild/src/routes/personal-center/#qyworkBinding.helper.ts`
- Create: `admin-rsbuild/src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts`

- [ ] **Step 1: 先写失败用例，固定企业微信环境识别与状态文案**

```ts
import { describe, expect, it } from 'vitest';
import {
  detectQyworkEntryMode,
  formatQyworkBindingStatus,
} from '../#qyworkBinding.helper';

describe('qyworkBinding.helper', () => {
  it('企业微信 UA 命中时返回 in_app', () => {
    expect(detectQyworkEntryMode('Mozilla wxwork/4.1.0')).toBe('in_app');
  });

  it('普通浏览器返回 desktop_qr', () => {
    expect(detectQyworkEntryMode('Mozilla/5.0 Chrome/130')).toBe('desktop_qr');
  });

  it('已绑定状态展示 userId 与时间', () => {
    expect(
      formatQyworkBindingStatus({
        isBound: true,
        providerUserId: 'zhangsan',
        boundAt: '2026-04-04 10:00:00',
      }),
    ).toContain('zhangsan');
  });
});
```

- [ ] **Step 2: 运行单测确认先失败**

Run: `pnpm test:run -- src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts`  
Expected: FAIL，提示 `Cannot find module '../#qyworkBinding.helper'`。

- [ ] **Step 3: 写最小实现，保持函数纯净**

```ts
export type QyworkEntryMode = 'in_app' | 'desktop_qr';

export const detectQyworkEntryMode = (userAgent: string): QyworkEntryMode => {
  return /wxwork/i.test(userAgent) ? 'in_app' : 'desktop_qr';
};

export const formatQyworkBindingStatus = (params: {
  isBound: boolean;
  providerUserId?: string;
  boundAt?: string;
}) => {
  if (!params.isBound) {
    return '未绑定';
  }
  return `已绑定 ${params.providerUserId || '-'} · ${params.boundAt || '-'}`;
};
```

- [ ] **Step 4: 重新运行单测确认转绿**

Run: `pnpm test:run -- src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts`  
Expected: PASS。

## Task 2: 后端先补 schema、配置字段与 Redis 会话基础（TDD）

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260404143000__mod_third_party_user_oauth.sql`
- Create: `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/model/OauthBindingSession.java`
- Create: `modelDesign/mod-third-party/mod-third-party-biz/src/main/java/io/github/modelDesign/thirdparty/oauth/service/OauthBindingSessionService.java`
- Create: `modelDesign/mod-third-party/mod-third-party-biz/src/test/java/io/github/modelDesign/thirdparty/oauth/service/OauthBindingSessionServiceTest.java`
- Modify: `modelDesign/mod-third-party/.../QyworkCorpConfig.java`
- Modify: `modelDesign/mod-third-party/.../QyworkConfigSaveRequest.java`
- Modify: `modelDesign/mod-third-party/.../QyworkConfigVo.java`
- Modify: `modelDesign/mod-third-party/.../QyworkCorpConfigService.java`
- Modify: `modelDesign/mod-third-party/.../QyworkProperties.java`

- [ ] **Step 1: 先写失败单测，锁定会话创建与过期判断**

```java
@Test
void createSessionShouldWritePendingStateWithExpireAt() {
    RedisTemplate<String, Object> redisTemplate = mock(RedisTemplate.class);
    ValueOperations<String, Object> valueOperations = mock(ValueOperations.class);
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);

    QyworkProperties properties = new QyworkProperties();
    properties.setBindingSessionKeyPrefix("oauth:binding:session:");
    properties.setBindingSceneKeyPrefix("oauth:binding:scene:");
    properties.setBindingSessionExpireSeconds(300L);

    OauthBindingSessionService service = new OauthBindingSessionService(redisTemplate, properties);
    OauthBindingSession session = service.createPendingSession(1L, 2L, "qywork", "ww123:100001", "desktop_qr");

    assertEquals(OauthBindingSessionStatus.PENDING, session.getStatus());
    verify(valueOperations).set(startsWith("oauth:binding:session:"), any(), any(Duration.class));
}
```

- [ ] **Step 2: 运行后端单测确认先失败**

Run: `./mvnw -q -pl mod-third-party/mod-third-party-biz -am -Dtest=OauthBindingSessionServiceTest test`  
Expected: FAIL，提示 `OauthBindingSessionService` 不存在或构造不匹配。

- [ ] **Step 3: 补最小实现与 migration**

```sql
ALTER TABLE "qyworkCorpConfig"
  ADD COLUMN IF NOT EXISTS "agentId" varchar(128) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "userOauth" (
  "id" bigserial PRIMARY KEY,
  "tenantId" bigint NOT NULL,
  "userId" bigint NOT NULL,
  "provider" varchar(64) NOT NULL,
  "providerAppId" varchar(255) NOT NULL,
  "providerUserId" varchar(255) NOT NULL,
  "providerUnionId" varchar(255),
  "providerOpenId" varchar(255),
  "nickname" varchar(255),
  "avatar" varchar(500),
  "extraJson" text NOT NULL DEFAULT '',
  "bindSource" varchar(32) NOT NULL,
  "status" varchar(32) NOT NULL,
  "boundAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAuthAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_userOauth_user_provider" UNIQUE ("tenantId", "userId", "provider"),
  CONSTRAINT "uk_userOauth_provider_identity" UNIQUE ("tenantId", "provider", "providerAppId", "providerUserId")
);
```

- [ ] **Step 4: 回跑后端单测与模块测试**

Run: `./mvnw -q -pl mod-third-party/mod-third-party-biz -am -Dtest=OauthBindingSessionServiceTest test`  
Expected: PASS。

## Task 3: 后端实现企业微信 OAuth 绑定链路（TDD）

**Files:**
- Create: `modelDesign/mod-third-party/.../domain/UserOauth.java`
- Create: `modelDesign/mod-third-party/.../mapper/UserOauthMapper.java`
- Create: `modelDesign/mod-third-party/.../service/UserOauthService.java`
- Create: `modelDesign/mod-third-party/.../client/QyworkOauthClient.java`
- Create: `modelDesign/mod-third-party/.../client/QyworkOauthUserInfoResponse.java`
- Create: `modelDesign/mod-third-party/.../service/QyworkOauthService.java`
- Create: `modelDesign/mod-third-party/.../controller/QyworkBindingController.java`
- Create: `modelDesign/mod-third-party/.../controller/QyworkOauthController.java`
- Create: `modelDesign/mod-third-party/.../request/CreateOauthBindingSessionRequest.java`
- Create: `modelDesign/mod-third-party/.../response/*.java`
- Create: `modelDesign/mod-third-party/.../test/java/io/github/modelDesign/thirdparty/qywork/service/QyworkOauthServiceTest.java`
- Modify: `modelDesign/mod-auth/.../AuthWebMvcConfigurer.java`

- [ ] **Step 1: 先写失败单测，锁定授权 URL 与冲突拦截**

```java
@Test
void buildAuthorizeUrlShouldContainAgentIdStateAndWechatRedirect() {
    String url = service.buildAuthorizeUrl("ww123", "100001", "https://host/api/third-party/qywork/oauth/callback", "state-1");
    assertTrue(url.contains("appid=ww123"));
    assertTrue(url.contains("agentid=100001"));
    assertTrue(url.contains("state=state-1"));
    assertTrue(url.endsWith("#wechat_redirect"));
}
```

```java
@Test
void bindShouldRejectWhenSameUserIdAlreadyBoundToAnotherUser() {
    when(userOauthService.findActiveByProviderIdentity(1L, "qywork", "ww123:100001", "zhangsan"))
        .thenReturn(existingBindingForOtherUser);

    BusinessException error = assertThrows(BusinessException.class,
        () -> service.completeBinding(session, "zhangsan", "QR_SCAN"));

    assertEquals(HttpStatus.CONFLICT.value(), error.getCode());
}
```

- [ ] **Step 2: 运行单测确认先失败**

Run: `./mvnw -q -pl mod-third-party/mod-third-party-biz -am -Dtest=QyworkOauthServiceTest test`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现，先打通这条链**

```java
// createSession:
// 1. 校验 current user、tenant、corpId/corpSecret/agentId/enabled
// 2. 根据 user-agent 生成 in_app / desktop_qr
// 3. 创建 Redis session
// 4. 返回 authUrl / qrCodeUrl / expireAt / pollIntervalMs

// callback:
// 1. stateToken 命中 session
// 2. 调用 qywork user/getuserinfo
// 3. 冲突校验
// 4. upsert userOauth
// 5. 更新 session success / failed
```

- [ ] **Step 4: 开放匿名入口并回跑测试**

Run: `./mvnw -q -pl mod-third-party/mod-third-party-biz -am test`  
Expected: PASS。

## Task 4: 前端接入配置页、绑定状态卡片与二维码面板（TDD）

**Files:**
- Modify: `admin-rsbuild/src/api/modules/qywork.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/qywork.ts`
- Modify: `admin-rsbuild/src/routes/system/third-party/qywork/index.tsx`
- Modify: `admin-rsbuild/src/routes/personal-center/#ThirdPartyTab.tsx`
- Create: `admin-rsbuild/src/routes/personal-center/#QyworkBindingPanel.tsx`
- Create: `admin-rsbuild/src/routes/personal-center/__tests__/ThirdPartyTab.test.tsx`

- [ ] **Step 1: 先写失败测试，锁定“租户已配置 + 未绑定”时显示绑定按钮**

```tsx
it('租户已配置且用户未绑定时展示绑定企业微信按钮', async () => {
  vi.spyOn(ApiQywork, 'getCurrentConfig').mockResolvedValue({
    tenantId: 1,
    corpId: 'ww123',
    corpSecret: 'secret',
    agentId: '100001',
    enabled: true,
    remark: '',
    createTime: '',
    updateTime: '',
  });
  vi.spyOn(ApiQywork, 'getCurrentBinding').mockResolvedValue({
    provider: 'qywork',
    isBound: false,
    canStartBinding: true,
  });

  render(<ThirdPartyTab />);
  expect(await screen.findByRole('button', { name: '绑定企业微信' })).toBeDefined();
});
```

- [ ] **Step 2: 跑前端测试确认先失败**

Run: `pnpm test:run -- src/routes/personal-center/__tests__/ThirdPartyTab.test.tsx`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

```ts
// ApiQywork
export const getCurrentBinding = () =>
  request<UserOauthBindingStatus>('/third-party/qywork/binding/current', { method: 'get' });

export const createBindingSession = (data: CreateQyworkBindingSessionParams) =>
  request<QyworkBindingSessionCreated>('/third-party/qywork/binding/session', { method: 'post', data });

export const getBindingSession = (sessionId: string) =>
  request<QyworkBindingSessionStatus>(`/third-party/qywork/binding/session/${sessionId}`, { method: 'get' });
```

- [ ] **Step 4: 再跑前端测试并做页面级冒烟**

Run: `pnpm test:run -- src/routes/personal-center/__tests__/ThirdPartyTab.test.tsx src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts`  
Expected: PASS。

## Task 5: 全链路验证与提交

**Files:**
- Verify only

- [ ] **Step 1: 跑前端相关测试**

Run: `pnpm test:run -- src/routes/login/__tests__/LoginMainCard.test.tsx src/routes/personal-center/__tests__/qyworkBinding.helper.test.ts src/routes/personal-center/__tests__/ThirdPartyTab.test.tsx`  
Expected: PASS。

- [ ] **Step 2: 跑前端构建**

Run: `pnpm build`  
Expected: BUILD SUCCESS。

- [ ] **Step 3: 跑后端模块测试**

Run: `./mvnw -q -pl mod-third-party/mod-third-party-biz -am test`  
Expected: PASS。

- [ ] **Step 4: 提交实现**

```bash
git add modelDesign/boot/src/main/resources/db/migration/V1.20260404143000__mod_third_party_user_oauth.sql
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthWebMvcConfigurer.java
git add modelDesign/mod-third-party
git add admin-rsbuild/src/api/modules/qywork.ts
git add admin-rsbuild/src/constants/queryKey/qywork.ts
git add admin-rsbuild/src/routes/system/third-party/qywork/index.tsx
git add admin-rsbuild/src/routes/personal-center
git commit -m "feat(qywork): add web oauth binding flow"
```

## 自检结论

- Spec 覆盖：已覆盖配置扩展、`user_oauth`、Redis 会话、企微内授权、桌面二维码绑定、冲突拦截、结果轮询与第一版验证要求。
- 占位检查：计划中没有 `TODO` / `TBD` / “后续再做” 型占位步骤；未做项已放进 spec 非目标，不进入实现步骤。
- 类型一致性：前端统一使用 `provider/providerUserId/sessionId/entryMode`，后端统一使用 `provider/providerAppId/stateToken/sceneToken`，避免命名漂移。

Plan complete and saved to `docs/superpowers/plans/2026-04-04-qywork-web-oauth-binding-implementation.md`. You already asked me to continue implementation, so I will proceed with **Inline Execution** in this worktree using `executing-plans`.
