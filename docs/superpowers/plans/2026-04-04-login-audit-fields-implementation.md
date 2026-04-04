# 登录审计字段增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有登录接口对外行为的前提下，为登录链路补齐成功/失败审计字段、当前用户设备化登录历史展示，以及后台登录审计分页查询接口。

**Architecture:** 后端继续复用 `userLoginHistory` 表与 `UserLoginHistoryService` 主链路，但通过 Flyway 扩字段、服务内聚的审计写入命令对象、独立的 UA 解析器，把“登录历史”升级为“登录审计事件流”。前端只增强个人中心的成功登录历史展示，不混入失败事件；管理员查询能力先落后端分页接口，等待后续页面接入。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Flyway、JUnit 5、Mockito、React 18、TanStack Query、Ant Design、Vitest

---

## 文件结构

- `modelDesign/boot/src/main/resources/db/migration/V1.20260404180000__mod_auth_login_audit_fields.sql`
  - 扩展 `userLoginHistory` 表字段、放宽成功/失败共用模型需要的可空约束，并补充查询索引。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/domain/UserLoginHistory.java`
  - 增加登录结果、账号、UA、浏览器、系统、设备、失败原因字段。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditStatusEnum.java`
  - 定义 `SUCCESS / FAILURE`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginDeviceTypeEnum.java`
  - 定义 `DESKTOP / MOBILE / TABLET / UNKNOWN`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginFailureReasonEnum.java`
  - 定义失败原因码。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfo.java`
  - 承载解析后的浏览器、系统、设备信息。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfoResolver.java`
  - 统一解析 `User-Agent`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditWriteCommand.java`
  - 登录审计写入命令对象，避免 `AuthService` 传一长串参数。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditRecordFactory.java`
  - 负责把写入命令转成 `UserLoginHistory`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserLoginHistoryService.java`
  - 接收写入命令、写入审计表、提供当前用户成功历史与管理员分页查询。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/AuthService.java`
  - 在成功/失败登录分支中接入统一审计写入。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditPageRequest.java`
  - 管理员登录审计分页筛选条件。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginHistoryVo.java`
  - 扩展当前用户成功登录历史返回字段。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditPageItemVo.java`
  - 管理员分页列表项。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java`
  - 提供管理员登录审计分页接口。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginClientInfoResolverTest.java`
  - 锁定 UA 解析结果。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditRecordFactoryTest.java`
  - 锁定成功/失败审计实体组装。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/AuthServiceTest.java`
  - 锁定成功/失败登录写入审计命令的行为。
- `admin-rsbuild/src/api/modules/passport.types.ts`
  - 扩展当前用户登录历史字段类型。
- `admin-rsbuild/src/routes/personal-center/components/loginHistoryDisplay.helper.ts`
  - 抽离浏览器、系统、设备、登录方式的展示文案逻辑。
- `admin-rsbuild/src/routes/personal-center/#SecurityTab.tsx`
  - 扩展表格列。
- `admin-rsbuild/src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts`
  - 锁定展示 helper 输出。
- `admin-rsbuild/src/routes/personal-center/__tests__/SecurityTab.test.tsx`
  - 锁定个人中心安全页新增列渲染。

### Task 1: 锁定 UA 解析器与审计枚举合同

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditStatusEnum.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginDeviceTypeEnum.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginFailureReasonEnum.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfo.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfoResolver.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginClientInfoResolverTest.java`

- [ ] **Step 1: 先写 UA 解析失败用例**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginClientInfoResolverTest {
    private final LoginClientInfoResolver resolver = new LoginClientInfoResolver();

    @Test
    void shouldResolveDesktopChrome() {
        LoginClientInfo info = resolver.resolve(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/134.0.0.0 Safari/537.36"
        );

        assertEquals("Chrome", info.getBrowserName());
        assertEquals("134.0.0.0", info.getBrowserVersion());
        assertEquals("macOS", info.getOsName());
        assertEquals("10_15_7", info.getOsVersion());
        assertEquals(LoginDeviceTypeEnum.DESKTOP.name(), info.getDeviceType());
    }

    @Test
    void shouldResolveWxworkAsMobileWhenUaContainsWxwork() {
        LoginClientInfo info = resolver.resolve(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) " +
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/4.1.30"
        );

        assertEquals("WeCom", info.getBrowserName());
        assertEquals("iOS", info.getOsName());
        assertEquals(LoginDeviceTypeEnum.MOBILE.name(), info.getDeviceType());
    }

    @Test
    void shouldFallbackToUnknownWhenUserAgentIsBlank() {
        LoginClientInfo info = resolver.resolve("");

        assertEquals("UNKNOWN", info.getBrowserName());
        assertEquals("UNKNOWN", info.getOsName());
        assertEquals(LoginDeviceTypeEnum.UNKNOWN.name(), info.getDeviceType());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginClientInfoResolverTest test`

Expected: FAIL，提示 `LoginClientInfoResolver` 或相关枚举类型不存在。

- [ ] **Step 3: 写最小可用的枚举、模型与解析器**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 登录客户端信息解析器。
 *
 * 第一版只覆盖当前需要的主流浏览器和系统识别，
 * 未识别时统一回退为 UNKNOWN，避免因解析失败阻断登录主链路。
 */
@Component
public class LoginClientInfoResolver {
    private static final Pattern CHROME_PATTERN = Pattern.compile("Chrome/([^\\s]+)");
    private static final Pattern EDGE_PATTERN = Pattern.compile("Edg/([^\\s]+)");
    private static final Pattern SAFARI_PATTERN = Pattern.compile("Version/([^\\s]+).*Safari");
    private static final Pattern IOS_PATTERN = Pattern.compile("OS ([\\d_]+)");
    private static final Pattern ANDROID_PATTERN = Pattern.compile("Android ([^;\\)]+)");
    private static final Pattern MAC_PATTERN = Pattern.compile("Mac OS X ([\\d_]+)");
    private static final Pattern WINDOWS_PATTERN = Pattern.compile("Windows NT ([\\d\\.]+)");

    public LoginClientInfo resolve(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return LoginClientInfo.unknown();
        }

        String normalized = userAgent.trim();
        String lowerCase = normalized.toLowerCase();

        String browserName = "UNKNOWN";
        String browserVersion = "";
        if (lowerCase.contains("wxwork")) {
            browserName = "WeCom";
        } else if (lowerCase.contains("edg/")) {
            browserName = "Edge";
            browserVersion = matchFirst(EDGE_PATTERN, normalized);
        } else if (lowerCase.contains("chrome/")) {
            browserName = "Chrome";
            browserVersion = matchFirst(CHROME_PATTERN, normalized);
        } else if (lowerCase.contains("safari") && lowerCase.contains("version/")) {
            browserName = "Safari";
            browserVersion = matchFirst(SAFARI_PATTERN, normalized);
        }

        String osName = "UNKNOWN";
        String osVersion = "";
        if (lowerCase.contains("iphone") || lowerCase.contains("ipad")) {
            osName = "iOS";
            osVersion = matchFirst(IOS_PATTERN, normalized);
        } else if (lowerCase.contains("android")) {
            osName = "Android";
            osVersion = matchFirst(ANDROID_PATTERN, normalized);
        } else if (lowerCase.contains("mac os x")) {
            osName = "macOS";
            osVersion = matchFirst(MAC_PATTERN, normalized);
        } else if (lowerCase.contains("windows nt")) {
            osName = "Windows";
            osVersion = matchFirst(WINDOWS_PATTERN, normalized);
        }

        String deviceType = LoginDeviceTypeEnum.UNKNOWN.name();
        if (lowerCase.contains("mobile") || lowerCase.contains("iphone") || lowerCase.contains("android")) {
            deviceType = LoginDeviceTypeEnum.MOBILE.name();
        } else if (lowerCase.contains("ipad") || lowerCase.contains("tablet")) {
            deviceType = LoginDeviceTypeEnum.TABLET.name();
        } else if (!"UNKNOWN".equals(osName)) {
            deviceType = LoginDeviceTypeEnum.DESKTOP.name();
        }

        return LoginClientInfo.builder()
                .browserName(browserName)
                .browserVersion(browserVersion)
                .osName(osName)
                .osVersion(osVersion)
                .deviceType(deviceType)
                .build();
    }

    private String matchFirst(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return "";
        }
        return matcher.group(1);
    }
}
```

- [ ] **Step 4: 重新运行解析器测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginClientInfoResolverTest test`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditStatusEnum.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginDeviceTypeEnum.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginFailureReasonEnum.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfo.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginClientInfoResolver.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginClientInfoResolverTest.java
git commit -m "test(auth): 锁定登录客户端信息解析规则"
```

### Task 2: 扩展审计表模型并锁定实体组装

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260404180000__mod_auth_login_audit_fields.sql`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditWriteCommand.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditRecordFactory.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/domain/UserLoginHistory.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditRecordFactoryTest.java`

- [ ] **Step 1: 先写成功/失败审计实体组装失败用例**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.auth.session.CurrentAdmin;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LoginAuditRecordFactoryTest {
    private final LoginAuditRecordFactory factory = new LoginAuditRecordFactory();

    @Test
    void shouldBuildSuccessRecordFromCurrentAdmin() {
        CurrentAdmin currentAdmin = CurrentAdmin.builder()
                .userId(8L)
                .tenantId(9L)
                .username("admin")
                .loginId("login-1")
                .loginIp("127.0.0.1")
                .build();

        LoginAuditWriteCommand command = LoginAuditWriteCommand.success(
                currentAdmin,
                "Mozilla/5.0",
                LoginClientInfo.builder()
                        .browserName("Chrome")
                        .browserVersion("134.0.0.0")
                        .osName("macOS")
                        .osVersion("10_15_7")
                        .deviceType("DESKTOP")
                        .build()
        );

        var record = factory.build(command);

        assertEquals(LoginAuditStatusEnum.SUCCESS.name(), record.getLoginStatus());
        assertEquals("admin", record.getUsername());
        assertEquals("login-1", record.getLoginId());
        assertEquals("Chrome", record.getBrowserName());
        assertNull(record.getFailureReasonCode());
    }

    @Test
    void shouldBuildFailureRecordWithNullableLoginId() {
        LoginAuditWriteCommand command = LoginAuditWriteCommand.failure(
                "ghost",
                null,
                null,
                "10.0.0.8",
                "Mozilla/5.0",
                LoginFailureReasonEnum.USER_NOT_FOUND,
                "用户不存在",
                LoginClientInfo.unknown()
        );

        var record = factory.build(command);

        assertEquals(LoginAuditStatusEnum.FAILURE.name(), record.getLoginStatus());
        assertEquals("ghost", record.getUsername());
        assertNull(record.getLoginId());
        assertEquals(LoginFailureReasonEnum.USER_NOT_FOUND.name(), record.getFailureReasonCode());
        assertEquals("用户不存在", record.getFailureReasonText());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditRecordFactoryTest test`

Expected: FAIL，提示 `LoginAuditWriteCommand` / `LoginAuditRecordFactory` 或新增字段不存在。

- [ ] **Step 3: 写 Flyway 迁移与领域模型**

```sql
ALTER TABLE "userLoginHistory"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "tenantId" DROP NOT NULL,
  ALTER COLUMN "loginId" DROP NOT NULL;

ALTER TABLE "userLoginHistory"
  ADD COLUMN IF NOT EXISTS "loginStatus" varchar(32) NOT NULL DEFAULT 'SUCCESS',
  ADD COLUMN IF NOT EXISTS "username" varchar(128) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "userAgent" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "browserName" varchar(64) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "browserVersion" varchar(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "osName" varchar(64) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "osVersion" varchar(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "deviceType" varchar(32) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS "failureReasonCode" varchar(64),
  ADD COLUMN IF NOT EXISTS "failureReasonText" varchar(255);

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_status_createTime"
  ON "userLoginHistory" ("loginStatus", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_username_createTime"
  ON "userLoginHistory" ("username", "createTime");
```

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserLoginHistory;
import org.springframework.stereotype.Component;

/**
 * 登录审计记录工厂。
 *
 * 把写入命令转换成可持久化实体，避免 AuthService 直接堆字段赋值。
 */
@Component
public class LoginAuditRecordFactory {
    public UserLoginHistory build(LoginAuditWriteCommand command) {
        UserLoginHistory history = new UserLoginHistory();
        history.setUserId(command.getUserId());
        history.setTenantId(command.getTenantId());
        history.setUsername(command.getUsername());
        history.setLoginId(command.getLoginId());
        history.setLoginIp(command.getLoginIp());
        history.setLoginType(command.getLoginType());
        history.setLoginStatus(command.getLoginStatus());
        history.setUserAgent(command.getUserAgent());
        history.setBrowserName(command.getBrowserName());
        history.setBrowserVersion(command.getBrowserVersion());
        history.setOsName(command.getOsName());
        history.setOsVersion(command.getOsVersion());
        history.setDeviceType(command.getDeviceType());
        history.setFailureReasonCode(command.getFailureReasonCode());
        history.setFailureReasonText(command.getFailureReasonText());
        return history;
    }
}
```

- [ ] **Step 4: 补齐写入命令对象和实体字段**

```java
@Data
@Builder
public class LoginAuditWriteCommand {
    private Long userId;
    private Long tenantId;
    private String username;
    private String loginId;
    private String loginIp;
    private String loginType;
    private String loginStatus;
    private String userAgent;
    private String browserName;
    private String browserVersion;
    private String osName;
    private String osVersion;
    private String deviceType;
    private String failureReasonCode;
    private String failureReasonText;

    public static LoginAuditWriteCommand success(CurrentAdmin currentAdmin,
                                                 String userAgent,
                                                 LoginClientInfo clientInfo) {
        return LoginAuditWriteCommand.builder()
                .userId(currentAdmin.getUserId())
                .tenantId(currentAdmin.getTenantId())
                .username(currentAdmin.getUsername())
                .loginId(currentAdmin.getLoginId())
                .loginIp(currentAdmin.getLoginIp())
                .loginType("PASSWORD")
                .loginStatus("SUCCESS")
                .userAgent(userAgent)
                .browserName(clientInfo.getBrowserName())
                .browserVersion(clientInfo.getBrowserVersion())
                .osName(clientInfo.getOsName())
                .osVersion(clientInfo.getOsVersion())
                .deviceType(clientInfo.getDeviceType())
                .build();
    }
}
```

- [ ] **Step 5: 重新运行工厂测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditRecordFactoryTest test`

Expected: PASS，成功/失败实体组装均通过。

- [ ] **Step 6: 提交这一小步**

```bash
git add modelDesign/boot/src/main/resources/db/migration/V1.20260404180000__mod_auth_login_audit_fields.sql \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/domain/UserLoginHistory.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditWriteCommand.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditRecordFactory.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditRecordFactoryTest.java
git commit -m "feat(auth): 扩展登录审计实体与迁移"
```

### Task 3: 在 AuthService 接入成功/失败审计写入

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserLoginHistoryService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/AuthService.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/AuthServiceTest.java`

- [ ] **Step 1: 先写 AuthService 失败/成功分支失败用例**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.auth.request.PasswordLoginRequest;
import io.github.modelDesign.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {
    @Test
    void passwordLoginShouldRecordFailureWhenUserNotFound() {
        UserService userService = mock(UserService.class);
        SessionRepository sessionRepository = mock(SessionRepository.class);
        TenantService tenantService = mock(TenantService.class);
        TokenService tokenService = mock(TokenService.class);
        UserLoginHistoryService loginHistoryService = mock(UserLoginHistoryService.class);
        LoginClientInfoResolver resolver = mock(LoginClientInfoResolver.class);

        when(userService.getByUsername("ghost")).thenReturn(null);
        when(resolver.resolve("Mozilla/5.0")).thenReturn(LoginClientInfo.unknown());

        AuthService authService = new AuthService(
                userService,
                sessionRepository,
                tenantService,
                tokenService,
                loginHistoryService,
                resolver
        );

        PasswordLoginRequest request = new PasswordLoginRequest();
        request.setUsername("ghost");
        request.setPassword("md5-value");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
        when(httpRequest.getRemoteAddr()).thenReturn("10.0.0.9");

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> authService.passwordLogin(request, httpRequest)
        );

        assertEquals("账号或密码错误", exception.getMessage());
        verify(loginHistoryService).record(any(LoginAuditWriteCommand.class));
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=AuthServiceTest test`

Expected: FAIL，提示 `AuthService` 构造器、审计写入方法或 UA 解析依赖不匹配。

- [ ] **Step 3: 改造 UserLoginHistoryService，只负责保存与查询**

```java
@Service
@RequiredArgsConstructor
public class UserLoginHistoryService extends ServiceImpl<UserLoginHistoryMapper, UserLoginHistory>
        implements IService<UserLoginHistory> {
    private final LoginAuditRecordFactory loginAuditRecordFactory;

    /**
     * 记录一次登录审计事件。
     */
    public void record(LoginAuditWriteCommand command) {
        save(loginAuditRecordFactory.build(command));
    }
}
```

- [ ] **Step 4: 改造 AuthService，在所有失败分支和成功分支写入审计**

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final TenantService tenantService;
    private final TokenService tokenService;
    private final UserLoginHistoryService userLoginHistoryService;
    private final LoginClientInfoResolver loginClientInfoResolver;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserLoginVo passwordLogin(PasswordLoginRequest request, HttpServletRequest httpRequest) {
        String loginIp = resolveIp(httpRequest);
        String userAgent = resolveUserAgent(httpRequest);
        LoginClientInfo clientInfo = loginClientInfoResolver.resolve(userAgent);
        User user = userService.getByUsername(request.getUsername());
        if (user == null) {
            recordFailure(request.getUsername(), null, null, loginIp, userAgent, clientInfo,
                    LoginFailureReasonEnum.USER_NOT_FOUND, "用户不存在");
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            recordFailure(request.getUsername(), user.getId(), user.getTenantId(), loginIp, userAgent, clientInfo,
                    LoginFailureReasonEnum.USER_DISABLED, "账号已被禁用");
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号已被禁用");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            recordFailure(request.getUsername(), user.getId(), user.getTenantId(), loginIp, userAgent, clientInfo,
                    LoginFailureReasonEnum.PASSWORD_MISMATCH, "密码错误");
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "账号或密码错误");
        }

        CurrentAdmin currentAdmin = buildCurrentAdmin(user, loginIp);
        sessionRepository.save(currentAdmin);
        userLoginHistoryService.record(LoginAuditWriteCommand.success(currentAdmin, userAgent, clientInfo));
        return UserLoginVo.builder()
                .token(tokenService.createToken(currentAdmin))
                .expireTime(tokenService.getExpireTime())
                .build();
    }
}
```

- [ ] **Step 5: 补齐成功登录与多失败分支断言**

```java
@Test
void passwordLoginShouldRecordSuccessAfterSessionSaved() {
    UserService userService = mock(UserService.class);
    SessionRepository sessionRepository = mock(SessionRepository.class);
    TenantService tenantService = mock(TenantService.class);
    TokenService tokenService = mock(TokenService.class);
    UserLoginHistoryService loginHistoryService = mock(UserLoginHistoryService.class);
    LoginClientInfoResolver resolver = mock(LoginClientInfoResolver.class);

    User user = new User();
    user.setId(1L);
    user.setTenantId(2L);
    user.setUsername("demo");
    user.setStatus(1);
    user.setPasswordHash(new BCryptPasswordEncoder().encode("md5-value"));

    when(userService.getByUsername("demo")).thenReturn(user);
    when(resolver.resolve("Mozilla/5.0")).thenReturn(LoginClientInfo.unknown());
    when(tokenService.createToken(any())).thenReturn("token-1");
    when(tokenService.getExpireTime()).thenReturn(LocalDateTime.now().plusHours(2));

    AuthService authService = new AuthService(
            userService,
            sessionRepository,
            tenantService,
            tokenService,
            loginHistoryService,
            resolver
    );

    PasswordLoginRequest request = new PasswordLoginRequest();
    request.setUsername("demo");
    request.setPassword("md5-value");
    HttpServletRequest httpRequest = mock(HttpServletRequest.class);
    when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");
    when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

    authService.passwordLogin(request, httpRequest);

    verify(sessionRepository).save(any());
    verify(loginHistoryService).record(any(LoginAuditWriteCommand.class));
}
```

- [ ] **Step 6: 运行 AuthService 测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=AuthServiceTest test`

Expected: PASS，失败登录与成功登录写入行为通过。

- [ ] **Step 7: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserLoginHistoryService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/AuthService.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/AuthServiceTest.java
git commit -m "feat(auth): 接入登录成功与失败审计写入"
```

### Task 4: 增强当前用户登录历史并落后台分页查询接口

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditPageRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditPageItemVo.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginHistoryVo.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/PassportController.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserLoginHistoryService.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginHistoryViewMappingTest.java`

- [ ] **Step 1: 先写 VO 映射失败用例，锁定返回字段**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginHistoryViewMappingTest {
    @Test
    void shouldMapSuccessHistoryToCurrentUserVo() {
        UserLoginHistory history = new UserLoginHistory();
        history.setLoginId("login-1");
        history.setLoginIp("127.0.0.1");
        history.setLoginType("PASSWORD");
        history.setBrowserName("Chrome");
        history.setBrowserVersion("134.0.0.0");
        history.setOsName("macOS");
        history.setOsVersion("10_15_7");
        history.setDeviceType("DESKTOP");
        history.setCreateTime(LocalDateTime.of(2026, 4, 4, 18, 0));

        LoginHistoryVo vo = UserLoginHistoryService.toCurrentUserHistoryVo(history);

        assertEquals("Chrome", vo.getBrowserName());
        assertEquals("10_15_7", vo.getOsVersion());
        assertEquals("DESKTOP", vo.getDeviceType());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginHistoryViewMappingTest test`

Expected: FAIL，提示 `LoginHistoryVo` 缺少浏览器/系统/设备字段或映射方法不存在。

- [ ] **Step 3: 扩展当前用户成功历史 VO 与查询条件**

```java
@Data
@Builder
@Schema(description = "登录历史记录")
public class LoginHistoryVo {
    @Schema(description = "登录流水号")
    private String loginId;

    @Schema(description = "登录 IP")
    private String loginIp;

    @Schema(description = "登录方式")
    private String loginType;

    @Schema(description = "登录时间")
    private LocalDateTime loginTime;

    @Schema(description = "浏览器名称")
    private String browserName;

    @Schema(description = "浏览器版本")
    private String browserVersion;

    @Schema(description = "操作系统名称")
    private String osName;

    @Schema(description = "操作系统版本")
    private String osVersion;

    @Schema(description = "设备类型")
    private String deviceType;
}
```

```java
public List<LoginHistoryVo> getRecentLoginHistory(Long userId, Long tenantId) {
    return lambdaQuery()
            .eq(UserLoginHistory::getUserId, userId)
            .eq(tenantId != null, UserLoginHistory::getTenantId, tenantId)
            .eq(UserLoginHistory::getLoginStatus, LoginAuditStatusEnum.SUCCESS.name())
            .orderByDesc(UserLoginHistory::getCreateTime)
            .last("limit 10")
            .list()
            .stream()
            .map(UserLoginHistoryService::toCurrentUserHistoryVo)
            .toList();
}
```

- [ ] **Step 4: 新增管理员分页请求/响应与控制器**

```java
@Data
@Schema(description = "登录审计分页请求")
public class LoginAuditPageRequest {
    @Schema(description = "页码")
    @Min(1)
    private Long current = 1L;

    @Schema(description = "每页条数")
    @Min(1)
    private Long pageSize = 10L;

    @Schema(description = "登录账号")
    private String username;

    @Schema(description = "租户 ID")
    private Long tenantId;

    @Schema(description = "登录状态")
    private String loginStatus;

    @Schema(description = "登录方式")
    private String loginType;

    @Schema(description = "设备类型")
    private String deviceType;
}
```

```java
@Tag(name = "登录审计")
@RestController
@RequestMapping("/auth/login_audit")
@RequiredArgsConstructor
public class LoginAuditController {
    private final UserLoginHistoryService userLoginHistoryService;

    @Operation(summary = "分页查询登录审计")
    @GetMapping("/page")
    public PageResponse<LoginAuditPageItemVo> page(@Valid LoginAuditPageRequest request) {
        return userLoginHistoryService.getAuditPage(request);
    }
}
```

- [ ] **Step 5: 运行映射测试并做一次后端编译冒烟**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginHistoryViewMappingTest test`

Expected: PASS，当前用户历史扩展字段映射通过。

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am test`

Expected: PASS，`mod-auth-biz` 模块测试通过，新的控制器和查询方法编译成功。

- [ ] **Step 6: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditPageRequest.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditPageItemVo.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginHistoryVo.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/PassportController.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserLoginHistoryService.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginHistoryViewMappingTest.java
git commit -m "feat(auth): 增强登录历史查询并新增审计分页接口"
```

### Task 5: 增强前端安全页登录设备展示

**Files:**
- Modify: `admin-rsbuild/src/api/modules/passport.types.ts`
- Create: `admin-rsbuild/src/routes/personal-center/components/loginHistoryDisplay.helper.ts`
- Modify: `admin-rsbuild/src/routes/personal-center/#SecurityTab.tsx`
- Test: `admin-rsbuild/src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts`
- Test: `admin-rsbuild/src/routes/personal-center/__tests__/SecurityTab.test.tsx`

- [ ] **Step 1: 先写展示 helper 与 SecurityTab 失败用例**

```ts
import { describe, expect, it } from 'vitest';

import {
  formatBrowserDisplay,
  formatDeviceType,
  formatOsDisplay,
} from '../components/loginHistoryDisplay.helper';

describe('loginHistoryDisplay.helper', () => {
  it('浏览器名称和版本会拼成一列展示', () => {
    expect(formatBrowserDisplay('Chrome', '134.0.0.0')).toBe(
      'Chrome 134.0.0.0',
    );
  });

  it('未知设备类型回退为未知设备', () => {
    expect(formatDeviceType('UNKNOWN')).toBe('未知设备');
  });

  it('系统名称和版本为空时返回短横线', () => {
    expect(formatOsDisplay('', '')).toBe('-');
  });
});
```

```tsx
it('最近登录历史会展示浏览器、操作系统和设备类型列', async () => {
  vi.mocked(ApiPassport.getLoginHistory).mockResolvedValue([
    {
      loginId: 'login-1',
      loginIp: '127.0.0.1',
      loginType: 'PASSWORD',
      loginTime: '2026-04-04 18:00:00',
      browserName: 'Chrome',
      browserVersion: '134.0.0.0',
      osName: 'macOS',
      osVersion: '10_15_7',
      deviceType: 'DESKTOP',
    },
  ]);

  render(
    <QueryClientProvider client={queryClient}>
      <SecurityTab />
    </QueryClientProvider>,
  );

  expect(await screen.findByText('Chrome 134.0.0.0')).toBeDefined();
  expect(screen.getByText('macOS 10_15_7')).toBeDefined();
  expect(screen.getByText('桌面端')).toBeDefined();
});
```

- [ ] **Step 2: 运行前端测试确认当前失败**

Run: `cd admin-rsbuild && npm run test:run -- src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts src/routes/personal-center/__tests__/SecurityTab.test.tsx`

Expected: FAIL，提示 helper 文件不存在或 `LoginHistoryVo` 缺字段。

- [ ] **Step 3: 实现展示 helper 与类型扩展**

```ts
/**
 * 登录历史展示辅助函数。
 *
 * 统一把接口中的原始值转换成适合列表展示的文案，
 * 避免 SecurityTab 组件里重复堆叠判断分支。
 */
export const formatBrowserDisplay = (
  browserName?: string,
  browserVersion?: string,
) => {
  if (!browserName) {
    return '-';
  }
  if (!browserVersion) {
    return browserName;
  }
  return `${browserName} ${browserVersion}`;
};

export const formatDeviceType = (deviceType?: string) => {
  if (deviceType === 'DESKTOP') {
    return '桌面端';
  }
  if (deviceType === 'MOBILE') {
    return '手机';
  }
  if (deviceType === 'TABLET') {
    return '平板';
  }
  return '未知设备';
};
```

- [ ] **Step 4: 更新 SecurityTab 列定义**

```tsx
const loginHistoryColumns: ColumnsType<LoginHistoryVo> = [
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    key: 'loginTime',
    render: (value: string) => formatDateTime(value),
  },
  {
    title: '登录方式',
    dataIndex: 'loginType',
    key: 'loginType',
    render: (value: string) => formatLoginType(value),
  },
  {
    title: '登录 IP',
    dataIndex: 'loginIp',
    key: 'loginIp',
    render: (value: string) => getDisplayText(value),
  },
  {
    title: '浏览器',
    key: 'browser',
    render: (_, record) =>
      formatBrowserDisplay(record.browserName, record.browserVersion),
  },
  {
    title: '操作系统',
    key: 'os',
    render: (_, record) => formatOsDisplay(record.osName, record.osVersion),
  },
  {
    title: '设备类型',
    dataIndex: 'deviceType',
    key: 'deviceType',
    render: (value: string) => formatDeviceType(value),
  },
  {
    title: '登录流水号',
    dataIndex: 'loginId',
    key: 'loginId',
    render: (value: string) => getDisplayText(value),
  },
];
```

- [ ] **Step 5: 重新运行前端测试**

Run: `cd admin-rsbuild && npm run test:run -- src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts src/routes/personal-center/__tests__/SecurityTab.test.tsx`

Expected: PASS，helper 输出和表格新增列渲染通过。

- [ ] **Step 6: 提交这一小步**

```bash
git add admin-rsbuild/src/api/modules/passport.types.ts \
  admin-rsbuild/src/routes/personal-center/components/loginHistoryDisplay.helper.ts \
  admin-rsbuild/src/routes/personal-center/#SecurityTab.tsx \
  admin-rsbuild/src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts \
  admin-rsbuild/src/routes/personal-center/__tests__/SecurityTab.test.tsx
git commit -m "feat(frontend): 增强最近登录历史设备信息展示"
```

### Task 6: 联调验证与交付核查

**Files:**
- Modify: `docs/superpowers/plans/2026-04-04-login-audit-fields-implementation.md`

- [ ] **Step 1: 运行后端模块测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am test`

Expected: PASS，`mod-auth-biz` 相关单测全部通过。

- [ ] **Step 2: 运行前端相关测试**

Run: `cd admin-rsbuild && npm run test:run -- src/routes/personal-center/__tests__/loginHistoryDisplay.helper.test.ts src/routes/personal-center/__tests__/SecurityTab.test.tsx`

Expected: PASS，前端新增与回归测试通过。

- [ ] **Step 3: 运行前端静态检查**

Run: `cd admin-rsbuild && npm run lint`

Expected: PASS，无新增 lint 报错。

- [ ] **Step 4: 进行手工冒烟验证**

Run:

```bash
curl -X POST http://localhost:9999/passport/password_login \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/134.0.0.0' \
  -d '{"username":"admin","password":"<md5-password>"}'
```

Expected: 成功返回 token，数据库新增一条 `SUCCESS` 审计记录。

Run:

```bash
curl -X POST http://localhost:9999/passport/password_login \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: Mozilla/5.0 (iPhone) wxwork/4.1.30' \
  -d '{"username":"admin","password":"wrong"}'
```

Expected: 返回登录失败错误，数据库新增一条 `FAILURE` 审计记录，并带失败原因码。

- [ ] **Step 5: 完成最终提交**

```bash
git status --short
git add modelDesign/boot/src/main/resources/db/migration/V1.20260404180000__mod_auth_login_audit_fields.sql \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth \
  admin-rsbuild/src/api/modules/passport.types.ts \
  admin-rsbuild/src/routes/personal-center
git commit -m "feat(auth): 增强登录审计字段与设备历史展示"
```

## 自检结果

- **Spec coverage:** 设计文档要求的成功/失败审计、UA 原文与解析字段、失败原因码、当前用户成功历史增强、管理员分页查询接口，都分别落在 Task 1 到 Task 5，没有遗漏。
- **Placeholder scan:** 全文没有 `TODO / TBD / implement later / add appropriate` 一类占位说法；每个任务都给了文件、命令、测试或代码骨架。
- **Type consistency:** 统一使用 `LoginAuditWriteCommand` 作为写入命令，统一使用 `LoginClientInfo` 作为 UA 解析结果，前后端返回字段保持 `browserName / browserVersion / osName / osVersion / deviceType` 一致。

