# Login Sliding Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复登录自动滑动窗口续期，让活跃请求能够同时续 Redis session 和 JWT，并由前端自动接收新 token。

**Architecture:** 后端在 `AuthInterceptor` 鉴权成功后判断 JWT 剩余有效期，低于阈值时用同一个 `loginId` 重签 token，并通过 `X-Renewed-Token` 与 `X-Renewed-Expire-Time` 响应头返回。前端在登录成功时保存 `token + expireTime`，并在 axios 响应拦截器里只用“更晚的过期时间”覆盖本地 token，避免并发请求回写旧 token。

**Tech Stack:** Spring Boot 3.5、JJWT、Redis、JUnit 5、React 18、TypeScript、Zustand、Axios、Vitest

---

## 文件结构

- 后端认证配置与续签能力
  - Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java`
  - Modify: `modelDesign/boot/src/main/resources/application.yaml`
  - Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/session/TokenService.java`
  - Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/interceptor/AuthInterceptor.java`

- 后端测试
  - Create: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/interceptor/AuthInterceptorTest.java`

- 前端认证状态与登录契约
  - Modify: `admin-rsbuild/src/api/modules/passport.types.ts`
  - Modify: `admin-rsbuild/src/store/auth.ts`
  - Modify: `admin-rsbuild/src/routes/login/index.tsx`
  - Create: `admin-rsbuild/src/store/__tests__/auth.test.ts`

- 前端请求封装与续签接收
  - Modify: `admin-rsbuild/src/utils/request.ts`
  - Create: `admin-rsbuild/src/utils/__tests__/request.test.ts`

---

### Task 1: 后端续签规则与拦截器响应头

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java`
- Modify: `modelDesign/boot/src/main/resources/application.yaml`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/session/TokenService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/interceptor/AuthInterceptor.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/interceptor/AuthInterceptorTest.java`

- [ ] **Step 1: 先写失败测试，锁定“接近过期才续签”和“已过期不续签”的行为**

```java
package io.github.modelDesign.auth.interceptor;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.auth.session.SessionRepository;
import io.github.modelDesign.auth.session.TokenService;
import io.github.modelDesign.common.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthInterceptorTest {
    @Test
    void preHandleShouldWriteRenewedHeadersWhenTokenIsNearExpiry() {
        FakeTokenService tokenService = new FakeTokenService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        sessionRepository.currentAdmin = CurrentAdmin.builder()
                .userId(1001L)
                .tenantId(2002L)
                .username("alice")
                .loginId("login-1")
                .build();
        tokenService.claimsExpiration = Date.from(Instant.now().plusSeconds(30));
        tokenService.renewNeeded = true;

        AuthInterceptor interceptor = new AuthInterceptor(tokenService, sessionRepository);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "old-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = interceptor.preHandle(request, response, new Object());

        assertTrue(allowed);
        assertEquals("login-1", sessionRepository.refreshedLoginId);
        assertEquals("renewed-token", response.getHeader("X-Renewed-Token"));
        assertEquals("999999", response.getHeader("X-Renewed-Expire-Time"));
    }

    @Test
    void preHandleShouldRejectWhenJwtAlreadyExpired() {
        FakeTokenService tokenService = new FakeTokenService();
        FakeSessionRepository sessionRepository = new FakeSessionRepository();
        tokenService.parseException = new UnauthorizedException("未登录或登录已过期");

        AuthInterceptor interceptor = new AuthInterceptor(tokenService, sessionRepository);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "expired-token");

        assertThrows(UnauthorizedException.class, () -> interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        ));
    }
}
```

- [ ] **Step 2: 运行测试，确认当前代码还没有续签响应头能力**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-auth/mod-auth-biz -Dtest=AuthInterceptorTest test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: class AuthInterceptorTest
cannot find symbol: method shouldRenew(...)
```

- [ ] **Step 3: 写最小实现，增加续签阈值配置和 token 续签能力**

```java
@Data
@ConfigurationProperties(prefix = "model-design.auth")
public class AuthProperties {
    /**
     * token 续签阈值，单位秒。
     */
    private long renewThresholdSeconds = 1800;
}
```

```yaml
model-design:
  auth:
    token-expire-seconds: ${AUTH_TOKEN_EXPIRE_SECONDS:7200}
    renew-threshold-seconds: ${AUTH_RENEW_THRESHOLD_SECONDS:1800}
```

```java
/**
 * 判断当前 claims 是否进入续签窗口。
 *
 * @param claims 已解析的 JWT 声明
 * @return 是否需要续签
 */
public boolean shouldRenew(Claims claims) {
    Date expiration = claims.getExpiration();
    if (expiration == null) {
        return false;
    }
    long remainingSeconds =
            (expiration.getTime() - System.currentTimeMillis()) / 1000;
    return remainingSeconds <= authProperties.getRenewThresholdSeconds();
}

/**
 * 生成新的访问令牌过期时间。
 *
 * @return 新的过期时间戳
 */
public long createExpireTime() {
    return System.currentTimeMillis()
            + authProperties.getTokenExpireSeconds() * 1000;
}
```

```java
public class AuthInterceptor implements HandlerInterceptor {
    /**
     * 续签 token 响应头。
     */
    static final String RENEWED_TOKEN_HEADER = "X-Renewed-Token";

    /**
     * 续签 token 过期时间响应头。
     */
    static final String RENEWED_EXPIRE_TIME_HEADER = "X-Renewed-Expire-Time";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("Authorization");
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        try {
            Claims claims = tokenService.parseClaims(token);
            String loginId = claims.get("loginId", String.class);
            CurrentAdmin currentAdmin = sessionRepository.get(loginId);
            if (currentAdmin == null) {
                throw new UnauthorizedException("未登录或登录已过期");
            }
            sessionRepository.refresh(loginId);
            if (tokenService.shouldRenew(claims)) {
                String renewedToken = tokenService.createToken(currentAdmin);
                long renewedExpireTime = tokenService.createExpireTime();
                response.setHeader(RENEWED_TOKEN_HEADER, renewedToken);
                response.setHeader(RENEWED_EXPIRE_TIME_HEADER, String.valueOf(renewedExpireTime));
            }
            AuthContext.set(currentAdmin);
            return true;
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
    }
}
```

- [ ] **Step 4: 补齐测试替身，让测试可以验证 refresh 和响应头**

```java
private static final class FakeSessionRepository extends SessionRepository {
    private CurrentAdmin currentAdmin;
    private String refreshedLoginId;

    FakeSessionRepository() {
        super(null, new AuthProperties());
    }

    @Override
    public CurrentAdmin get(String loginId) {
        return currentAdmin;
    }

    @Override
    public void refresh(String loginId) {
        refreshedLoginId = loginId;
    }
}

private static final class FakeTokenService extends TokenService {
    private Date claimsExpiration;
    private boolean renewNeeded;
    private RuntimeException parseException;

    FakeTokenService() {
        super(new AuthProperties());
    }

    @Override
    public Claims parseClaims(String token) {
        if (parseException != null) {
            throw parseException;
        }
        Claims claims = Jwts.claims();
        claims.put("loginId", "login-1");
        claims.setExpiration(claimsExpiration);
        return claims;
    }

    @Override
    public boolean shouldRenew(Claims claims) {
        return renewNeeded;
    }

    @Override
    public String createToken(CurrentAdmin currentAdmin) {
        return "renewed-token";
    }

    @Override
    public long createExpireTime() {
        return 999999L;
    }
}
```

- [ ] **Step 5: 再跑后端测试，确认续签逻辑变绿**

Run:

```bash
mvn -f modelDesign/pom.xml -pl mod-auth/mod-auth-biz -Dtest=AuthInterceptorTest test
```

Expected:

```text
BUILD SUCCESS
Tests run: 2, Failures: 0, Errors: 0
```

- [ ] **Step 6: 提交后端续签改动**

```bash
git add \
  modelDesign/boot/src/main/resources/application.yaml \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/interceptor/AuthInterceptor.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/session/TokenService.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/interceptor/AuthInterceptorTest.java
git commit -m "feat: #0 增加登录续签响应头"
```

### Task 2: 前端认证状态保存过期时间并防并发回写

**Files:**
- Modify: `admin-rsbuild/src/api/modules/passport.types.ts`
- Modify: `admin-rsbuild/src/store/auth.ts`
- Modify: `admin-rsbuild/src/routes/login/index.tsx`
- Test: `admin-rsbuild/src/store/__tests__/auth.test.ts`

- [ ] **Step 1: 先写失败测试，锁定登录保存和“只接收更晚过期时间”的行为**

```ts
import { beforeEach, describe, expect, it } from 'vitest';

import useAuthStore from '../auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();
  });

  it('登录成功时应同时保存 token 和过期时间', () => {
    useAuthStore.getState().setAuth('token-1', 1000);

    expect(useAuthStore.getState().token).toBe('token-1');
    expect(useAuthStore.getState().tokenExpireTime).toBe(1000);
    expect(localStorage.getItem('token')).toBe('token-1');
    expect(localStorage.getItem('tokenExpireTime')).toBe('1000');
  });

  it('续签时只应接受更晚的过期时间', () => {
    useAuthStore.getState().setAuth('token-1', 1000);

    useAuthStore.getState().renewTokenIfNewer('token-older', 900);
    expect(useAuthStore.getState().token).toBe('token-1');

    useAuthStore.getState().renewTokenIfNewer('token-2', 1200);
    expect(useAuthStore.getState().token).toBe('token-2');
    expect(useAuthStore.getState().tokenExpireTime).toBe(1200);
  });
});
```

- [ ] **Step 2: 运行前端测试，确认 store 还没有这些能力**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/store/__tests__/auth.test.ts
```

Expected:

```text
FAIL
TypeError: useAuthStore.getState(...).setAuth is not a function
```

- [ ] **Step 3: 扩展登录返回类型和 auth store，加入 `tokenExpireTime`、`setAuth`、`renewTokenIfNewer`**

```ts
export interface UserLoginVo {
  /**
   * 访问令牌
   */
  token: string;

  /**
   * 令牌过期时间戳
   */
  expireTime: number;
}
```

```ts
interface AuthStore {
  token: string;
  tokenExpireTime: number;
  setAuth: (token: string, tokenExpireTime: number) => void;
  renewTokenIfNewer: (token: string, tokenExpireTime: number) => void;
}

const useAuthStore = create<AuthStore>((set, get) => {
  return {
    token: localStorage.getItem('token') || '',
    tokenExpireTime: Number(localStorage.getItem('tokenExpireTime') || 0),
    menus: [],

    setAuth(token, tokenExpireTime) {
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpireTime', String(tokenExpireTime));
      set({ token, tokenExpireTime });
    },
    renewTokenIfNewer(token, tokenExpireTime) {
      const currentExpireTime = get().tokenExpireTime;
      if (tokenExpireTime <= currentExpireTime) {
        return;
      }
      get().setAuth(token, tokenExpireTime);
    },
    clearAuth() {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpireTime');
      set({
        token: '',
        tokenExpireTime: 0,
        currentInfo: undefined,
        menus: [],
        loadState: 0,
      });
    },
  };
});
```

```tsx
const setAuth = useAuthStore((state) => state.setAuth);

const mutation = useMutation({
  mutationFn: ApiPassport.passwordLogin,
  onSuccess: (data) => {
    setAuth(data.token, data.expireTime);
    navigate({ to: search.redirect, replace: true });
  },
});
```

- [ ] **Step 4: 再跑 store 测试，确认登录态状态机变绿**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/store/__tests__/auth.test.ts
```

Expected:

```text
✓ src/store/__tests__/auth.test.ts
2 passed
```

- [ ] **Step 5: 提交前端认证 store 改动**

```bash
git add \
  admin-rsbuild/src/api/modules/passport.types.ts \
  admin-rsbuild/src/routes/login/index.tsx \
  admin-rsbuild/src/store/auth.ts \
  admin-rsbuild/src/store/__tests__/auth.test.ts
git commit -m "feat: #0 保存登录续签过期时间"
```

### Task 3: 请求拦截器接收续签响应头并完成链路验证

**Files:**
- Modify: `admin-rsbuild/src/utils/request.ts`
- Test: `admin-rsbuild/src/utils/__tests__/request.test.ts`

- [ ] **Step 1: 先写失败测试，锁定“读响应头并只更新更晚 token”的请求层行为**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import useAuthStore from '@/store/auth';

vi.mock('axios');

describe('request renewal interceptor', () => {
  const requestHandlers: Array<(config: any) => any> = [];
  const responseFulfilled: Array<(response: any) => any> = [];

  beforeEach(async () => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();

    vi.mocked(axios.create).mockReturnValue({
      interceptors: {
        request: { use: (handler: any) => requestHandlers.push(handler) },
        response: {
          use: (fulfilled: any) => responseFulfilled.push(fulfilled),
        },
      },
      request: vi.fn(),
    } as any);

    await import('../request');
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requestHandlers.length = 0;
    responseFulfilled.length = 0;
  });

  it('响应头带续签 token 时应更新本地认证状态', () => {
    useAuthStore.getState().setAuth('old-token', 1000);

    const data = responseFulfilled[0]({
      data: { ok: true },
      headers: {
        'x-renewed-token': 'new-token',
        'x-renewed-expire-time': '2000',
      },
    });

    expect(data).toEqual({ ok: true });
    expect(useAuthStore.getState().token).toBe('new-token');
    expect(useAuthStore.getState().tokenExpireTime).toBe(2000);
  });
});
```

- [ ] **Step 2: 运行测试，确认当前拦截器不会接收续签响应头**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/utils/__tests__/request.test.ts
```

Expected:

```text
FAIL
Expected: "new-token"
Received: "old-token"
```

- [ ] **Step 3: 在响应拦截器中读取续签响应头，并复用 store 的防覆盖逻辑**

```ts
const RENEWED_TOKEN_HEADER = 'x-renewed-token';
const RENEWED_EXPIRE_TIME_HEADER = 'x-renewed-expire-time';

instance.interceptors.response.use(
  (response) => {
    const renewedToken = response.headers?.[RENEWED_TOKEN_HEADER];
    const renewedExpireTimeHeader =
      response.headers?.[RENEWED_EXPIRE_TIME_HEADER];
    const renewedExpireTime = Number(renewedExpireTimeHeader || 0);

    if (renewedToken && renewedExpireTime > 0) {
      useAuthStore
        .getState()
        .renewTokenIfNewer(renewedToken, renewedExpireTime);
    }
    return response.data;
  },
  (error) => {
    if (error?.response) {
      const requestError = new RequestError(error.response);
      const config = error.config;
      if (!get(config, 'skipErrorHandler', false)) {
        if (requestError.code === 401) {
          const { loadState } = useAuthStore.getState();
          if (loadState === 2) {
            openUnauthorizedModal();
          }
        }
      }
      return Promise.reject(requestError);
    }
    return Promise.reject(error);
  },
);
```

- [ ] **Step 4: 运行前端请求测试，再跑一轮后端和前端目标测试**

Run:

```bash
pnpm --dir admin-rsbuild test:run src/utils/__tests__/request.test.ts
mvn -f modelDesign/pom.xml -pl mod-auth/mod-auth-biz -Dtest=AuthInterceptorTest test
pnpm --dir admin-rsbuild test:run src/store/__tests__/auth.test.ts src/utils/__tests__/request.test.ts
```

Expected:

```text
✓ src/utils/__tests__/request.test.ts
✓ src/store/__tests__/auth.test.ts
BUILD SUCCESS
```

- [ ] **Step 5: 做一次人工回归说明并提交最后一组改动**

```text
手工回归步骤：
1. 登录后台，确认 localStorage 中有 token 和 tokenExpireTime。
2. 将后端 token 生命周期临时调低到 2 分钟、续签阈值调到 90 秒。
3. 在快到期时继续访问任意受保护页面，请求响应头应出现 X-Renewed-Token。
4. 浏览器 localStorage 中 tokenExpireTime 应向后推进，页面不应跳登录页。
5. 停止操作直到超过新 token 生命周期，再访问接口应返回 401 并跳转登录页。
```

```bash
git add \
  admin-rsbuild/src/utils/request.ts \
  admin-rsbuild/src/utils/__tests__/request.test.ts
git commit -m "fix: #0 修复登录滑动续期"
```

