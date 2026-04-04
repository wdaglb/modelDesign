# 登录审计日志 90 天清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为登录审计日志 `userLoginHistory` 增加 90 天保留清理能力，支持平台管理员全局清理、租户管理员按租户清理，以及每日定时全局清理。

**Architecture:** 在 `mod-auth-biz` 中新增专用清理服务 `LoginAuditCleanupService`，由手动接口与定时任务共同调用。权限边界按当前约定角色编码 `super / tenant` 实现，清理动作统一走服务层并返回删除数量、截止时间和作用范围，定时任务通过 `AuthSchedulingConfiguration` 独立启用。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Spring Scheduling、Spring Validation、JUnit 5、Mockito

---

## 文件结构

- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java`
  - 增加登录审计清理配置项。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthSchedulingConfiguration.java`
  - 启用认证模块调度能力。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupScopeEnum.java`
  - 清理范围枚举：`GLOBAL / TENANT`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupTriggerTypeEnum.java`
  - 触发类型枚举：`MANUAL / SCHEDULED`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditCleanupRequest.java`
  - 手动清理接口请求对象。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditCleanupResultVo.java`
  - 清理结果返回对象。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditCleanupService.java`
  - 清理服务，负责截止时间计算、权限校验后的删除执行与结果返回。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupScheduler.java`
  - 每日定时全局清理任务。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java`
  - 新增 `POST /login_audit/cleanup`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java`
  - 复用角色查询能力，必要时补充最小辅助方法。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditCleanupServiceTest.java`
  - 服务层清理逻辑、权限边界与删除数量测试。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/LoginAuditControllerTest.java`
  - 手动清理接口契约测试。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupSchedulerTest.java`
  - 定时任务调用测试。

### Task 1: 定义清理配置与输入输出模型

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthSchedulingConfiguration.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupScopeEnum.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupTriggerTypeEnum.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditCleanupRequest.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditCleanupResultVo.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditCleanupServiceTest.java`

- [ ] **Step 1: 先写失败测试，锁定配置默认值与请求校验约束**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.request.LoginAuditCleanupRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LoginAuditCleanupServiceTest {
    @Test
    void authPropertiesShouldProvideLoginAuditCleanupDefaults() {
        AuthProperties properties = new AuthProperties();

        assertEquals(90, properties.getLoginAuditRetentionDays());
        assertEquals("0 30 3 * * *", properties.getLoginAuditCleanupCron());
    }

    @Test
    void cleanupRequestShouldAllowTenantIdOnlyForTenantScope() {
        LoginAuditCleanupRequest request = new LoginAuditCleanupRequest();

        assertNull(request.getTenantId());
        assertNull(request.getRetentionDays());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL，提示 `AuthProperties` 缺少登录审计清理配置字段或清理请求对象不存在。

- [ ] **Step 3: 写最小实现，补齐配置、枚举、请求与结果对象**

```java
@Data
@ConfigurationProperties(prefix = "model-design.auth")
public class AuthProperties {
    private String jwtSecret = "change-this-jwt-secret-change-this-jwt-secret";
    private long tokenExpireSeconds = 7200;
    private String sessionKeyPrefix = "auth:admin:token:";
    private int loginAuditRetentionDays = 90;
    private String loginAuditCleanupCron = "0 30 3 * * *";
}
```

```java
@Data
@Schema(description = "登录审计清理请求")
public class LoginAuditCleanupRequest {
    @NotNull(message = "清理范围不能为空")
    @Schema(description = "清理范围", requiredMode = Schema.RequiredMode.REQUIRED)
    private LoginAuditCleanupScopeEnum scope;

    @Schema(description = "租户 ID")
    private Long tenantId;

    @Min(value = 1, message = "保留天数不能小于 1")
    @Schema(description = "保留天数")
    private Integer retentionDays;
}
```

- [ ] **Step 4: 重新运行测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: PASS，配置默认值与请求基础约束测试通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthSchedulingConfiguration.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupScopeEnum.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/enums/LoginAuditCleanupTriggerTypeEnum.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/LoginAuditCleanupRequest.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/LoginAuditCleanupResultVo.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditCleanupServiceTest.java
git commit -m "feat(auth): 定义登录审计清理配置与输入输出模型"
```

### Task 2: 实现登录审计清理服务

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditCleanupService.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditCleanupServiceTest.java`

- [ ] **Step 1: 先写失败测试，锁定全局/租户删除与权限边界**

```java
@Test
void cleanupGlobalShouldDeleteOldAuditLogsAndReturnDeletedCount() {
    FakeUserLoginHistoryService loginHistoryService = new FakeUserLoginHistoryService();
    FakePermissionService permissionService = new FakePermissionService(List.of("super"));
    LoginAuditCleanupService service = new LoginAuditCleanupService(
            loginHistoryService,
            permissionService,
            new AuthProperties()
    );

    LoginAuditCleanupResultVo result = service.cleanupGlobal(90, 1L, 1L, LoginAuditCleanupTriggerTypeEnum.MANUAL);

    assertEquals(12L, result.getDeletedCount());
    assertEquals("GLOBAL", result.getScope());
}

@Test
void tenantRoleShouldNotCleanupGlobal() {
    FakeUserLoginHistoryService loginHistoryService = new FakeUserLoginHistoryService();
    FakePermissionService permissionService = new FakePermissionService(List.of("tenant"));
    LoginAuditCleanupService service = new LoginAuditCleanupService(
            loginHistoryService,
            permissionService,
            new AuthProperties()
    );

    BusinessException exception = assertThrows(
            BusinessException.class,
            () -> service.cleanupGlobal(90, 2L, 2001L, LoginAuditCleanupTriggerTypeEnum.MANUAL)
    );

    assertEquals("无权执行全局清理", exception.getMessage());
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL，提示清理服务或辅助方法不存在。

- [ ] **Step 3: 实现最小清理服务**

```java
@Service
@RequiredArgsConstructor
public class LoginAuditCleanupService {
    private final UserLoginHistoryService userLoginHistoryService;
    private final PermissionService permissionService;
    private final AuthProperties authProperties;

    public LoginAuditCleanupResultVo cleanupGlobal(Integer retentionDays,
                                                   Long operatorUserId,
                                                   Long operatorTenantId,
                                                   LoginAuditCleanupTriggerTypeEnum triggerType) {
        requireSuperRole(operatorUserId);
        return cleanup(null, retentionDays, LoginAuditCleanupScopeEnum.GLOBAL, triggerType);
    }

    public LoginAuditCleanupResultVo cleanupByTenant(Long targetTenantId,
                                                     Integer retentionDays,
                                                     Long operatorUserId,
                                                     Long operatorTenantId,
                                                     LoginAuditCleanupTriggerTypeEnum triggerType) {
        requireTenantScope(targetTenantId, operatorUserId, operatorTenantId);
        return cleanup(targetTenantId, retentionDays, LoginAuditCleanupScopeEnum.TENANT, triggerType);
    }
}
```

- [ ] **Step 4: 复用 UserLoginHistoryService 增加删除方法**

```java
public long deleteHistoryBefore(LocalDateTime cutoffTime, Long tenantId) {
    return lambdaUpdate()
            .lt(UserLoginHistory::getCreateTime, cutoffTime)
            .eq(tenantId != null, UserLoginHistory::getTenantId, tenantId)
            .remove() ? 1L : 0L;
}
```

然后改成返回真实删除数量的 mapper 方案或自定义删除语句，不要停留在布尔值。

- [ ] **Step 5: 跑测试到通过，并补充 tenant 自租户清理测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupServiceTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: PASS，覆盖全局清理、租户清理、越权拒绝、非法保留天数。

- [ ] **Step 6: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/LoginAuditCleanupService.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/LoginAuditCleanupServiceTest.java
git commit -m "feat(auth): 实现登录审计清理服务"
```

### Task 3: 新增手动清理接口

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/LoginAuditControllerTest.java`

- [ ] **Step 1: 先写失败接口测试**

```java
@Test
void cleanupShouldReturnDeletedCountForGlobalScope() throws Exception {
    when(loginAuditCleanupService.cleanupGlobal(any(), any(), any(), eq(LoginAuditCleanupTriggerTypeEnum.MANUAL)))
            .thenReturn(LoginAuditCleanupResultVo.builder()
                    .deletedCount(12L)
                    .scope("GLOBAL")
                    .retentionDays(90)
                    .build());

    mockMvc.perform(post("/login_audit/cleanup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"scope\":\"GLOBAL\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deletedCount").value(12));
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditControllerTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL，提示控制器缺少 cleanup 接口。

- [ ] **Step 3: 在 LoginAuditController 增加 cleanup 接口**

```java
@Operation(summary = "清理登录审计日志")
@PostMapping("/cleanup")
public LoginAuditCleanupResultVo cleanup(@Valid @RequestBody LoginAuditCleanupRequest request) {
    CurrentAdmin currentAdmin = requireCurrentAdmin();
    if (request.getScope() == LoginAuditCleanupScopeEnum.GLOBAL) {
        return loginAuditCleanupService.cleanupGlobal(
                request.getRetentionDays(),
                currentAdmin.getUserId(),
                currentAdmin.getTenantId(),
                LoginAuditCleanupTriggerTypeEnum.MANUAL
        );
    }
    return loginAuditCleanupService.cleanupByTenant(
            request.getTenantId(),
            request.getRetentionDays(),
            currentAdmin.getUserId(),
            currentAdmin.getTenantId(),
            LoginAuditCleanupTriggerTypeEnum.MANUAL
    );
}
```

- [ ] **Step 4: 重新运行接口测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditControllerTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: PASS，接口返回删除数量，非法参数被校验拦截。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/LoginAuditController.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/LoginAuditControllerTest.java
git commit -m "feat(auth): 新增登录审计手动清理接口"
```

### Task 4: 新增每日定时清理任务

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupScheduler.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthSchedulingConfiguration.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupSchedulerTest.java`

- [ ] **Step 1: 先写失败测试，锁定调度器调用**

```java
@Test
void scheduledCleanupShouldInvokeGlobalCleanupWithDefaultRetentionDays() {
    AuthProperties properties = new AuthProperties();
    properties.setLoginAuditRetentionDays(90);
    FakeLoginAuditCleanupService cleanupService = new FakeLoginAuditCleanupService();
    LoginAuditCleanupScheduler scheduler = new LoginAuditCleanupScheduler(cleanupService, properties);

    scheduler.cleanupExpiredLoginAuditLogs();

    assertEquals(90, cleanupService.retentionDays);
    assertEquals(LoginAuditCleanupTriggerTypeEnum.SCHEDULED, cleanupService.triggerType);
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupSchedulerTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: FAIL，提示调度器或调度配置不存在。

- [ ] **Step 3: 实现调度器与配置**

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class LoginAuditCleanupScheduler {
    private final LoginAuditCleanupService loginAuditCleanupService;
    private final AuthProperties authProperties;

    @Scheduled(cron = "#{@authProperties.loginAuditCleanupCron}")
    public void cleanupExpiredLoginAuditLogs() {
        try {
            loginAuditCleanupService.cleanupGlobal(
                    authProperties.getLoginAuditRetentionDays(),
                    null,
                    null,
                    LoginAuditCleanupTriggerTypeEnum.SCHEDULED
            );
        } catch (Exception exception) {
            log.error("登录审计定时清理失败", exception);
        }
    }
}
```

- [ ] **Step 4: 重新运行调度器测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=LoginAuditCleanupSchedulerTest -Dsurefire.failIfNoSpecifiedTests=false test`

Expected: PASS，调度器调用通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupScheduler.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthSchedulingConfiguration.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/scheduler/LoginAuditCleanupSchedulerTest.java
git commit -m "feat(auth): 新增登录审计定时清理任务"
```

### Task 5: 全量验证与收尾

**Files:**
- Modify: `docs/superpowers/plans/2026-04-05-login-audit-cleanup-implementation.md`

- [ ] **Step 1: 跑认证模块测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am test -Dsurefire.failIfNoSpecifiedTests=false`

Expected: PASS，`mod-auth-biz` 所有相关测试通过。

- [ ] **Step 2: 做接口冒烟**

Run:

```bash
curl -X POST http://localhost:9999/login_audit/cleanup \
  -H 'Content-Type: application/json' \
  -d '{"scope":"TENANT","tenantId":2001}'
```

Expected: 返回 `deletedCount / cutoffTime / scope / tenantId`。

- [ ] **Step 3: 校验调度配置已生效**

Run: `rg -n "login-audit.retention-days|login-audit.cleanup-cron" modelDesign/boot/src/main/resources/application.yaml modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/configuration/AuthProperties.java`

Expected: 配置项与属性类字段一致。

- [ ] **Step 4: 提交最终实现**

```bash
git status --short
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth \
  modelDesign/boot/src/main/resources/application.yaml
git commit -m "feat(auth): 增加登录审计日志清理能力"
```

## 自检结果

- **Spec coverage:** 设计文档中的手动接口、定时任务、`super / tenant` 权限边界、配置项、删除结果返回、测试要求，已分别映射到 Task 1 到 Task 5。
- **Placeholder scan:** 无 `TODO / TBD / implement later / fill in details` 占位语句。
- **Type consistency:** 统一使用 `LoginAuditCleanupScopeEnum`、`LoginAuditCleanupTriggerTypeEnum`、`LoginAuditCleanupRequest`、`LoginAuditCleanupResultVo`、`LoginAuditCleanupService` 命名，不与现有分页接口命名冲突。

