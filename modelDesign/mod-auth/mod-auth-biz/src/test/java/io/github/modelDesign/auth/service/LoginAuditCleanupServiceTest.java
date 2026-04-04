package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.enums.LoginAuditCleanupScopeEnum;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.request.LoginAuditCleanupRequest;
import io.github.modelDesign.auth.response.LoginAuditCleanupResultVo;
import io.github.modelDesign.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 登录审计清理服务测试。
 */
class LoginAuditCleanupServiceTest {
    /**
     * 认证配置应提供登录审计清理默认值。
     */
    @Test
    void authPropertiesShouldProvideLoginAuditCleanupDefaults() {
        AuthProperties properties = new AuthProperties();

        assertEquals(90, properties.getLoginAuditRetentionDays());
        assertEquals("0 30 3 * * *", properties.getLoginAuditCleanupCron());
    }

    /**
     * 清理请求默认不带租户与保留天数。
     */
    @Test
    void cleanupRequestShouldAllowTenantIdOnlyForTenantScope() {
        LoginAuditCleanupRequest request = new LoginAuditCleanupRequest();

        assertNull(request.getTenantId());
        assertNull(request.getRetentionDays());
    }

    /**
     * 平台管理员全局清理时应返回删除数量与全局范围。
     */
    @Test
    void cleanupGlobalShouldDeleteOldAuditLogsAndReturnDeletedCount() {
        AuthProperties properties = new AuthProperties();
        FakeUserLoginHistoryService userLoginHistoryService =
                new FakeUserLoginHistoryService();
        FakePermissionService permissionService =
                new FakePermissionService(List.of("super"));
        LoginAuditCleanupService service = new LoginAuditCleanupService(
                userLoginHistoryService,
                permissionService,
                properties
        );

        LoginAuditCleanupResultVo result = service.cleanupGlobal(
                90,
                1L,
                1001L,
                LoginAuditCleanupTriggerTypeEnum.MANUAL
        );

        assertEquals(12L, result.getDeletedCount());
        assertEquals(LoginAuditCleanupScopeEnum.GLOBAL.name(), result.getScope());
        assertEquals(90, result.getRetentionDays());
    }

    /**
     * 租户角色不允许执行全局清理。
     */
    @Test
    void tenantRoleShouldNotCleanupGlobal() {
        LoginAuditCleanupService service = new LoginAuditCleanupService(
                new FakeUserLoginHistoryService(),
                new FakePermissionService(List.of("tenant")),
                new AuthProperties()
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.cleanupGlobal(
                        90,
                        2L,
                        2001L,
                        LoginAuditCleanupTriggerTypeEnum.MANUAL
                )
        );

        assertEquals(HttpStatus.FORBIDDEN.value(), exception.getStatus());
        assertEquals("无权执行全局清理", exception.getMessage());
    }

    /**
     * 租户管理员只允许清理自己的租户日志。
     */
    @Test
    void tenantRoleShouldOnlyCleanupOwnTenant() {
        LoginAuditCleanupService service = new LoginAuditCleanupService(
                new FakeUserLoginHistoryService(),
                new FakePermissionService(List.of("tenant")),
                new AuthProperties()
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.cleanupByTenant(
                        3001L,
                        90,
                        2L,
                        2001L,
                        LoginAuditCleanupTriggerTypeEnum.MANUAL
                )
        );

        assertEquals(HttpStatus.FORBIDDEN.value(), exception.getStatus());
        assertEquals("无权清理其它租户日志", exception.getMessage());
    }

    /**
     * 非法保留天数应被拒绝。
     */
    @Test
    void cleanupShouldRejectNonPositiveRetentionDays() {
        LoginAuditCleanupService service = new LoginAuditCleanupService(
                new FakeUserLoginHistoryService(),
                new FakePermissionService(List.of("super")),
                new AuthProperties()
        );

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.cleanupGlobal(
                        0,
                        1L,
                        1001L,
                        LoginAuditCleanupTriggerTypeEnum.MANUAL
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatus());
        assertEquals("保留天数不能小于 1", exception.getMessage());
    }

    /**
     * 登录历史服务测试替身。
     */
    private static final class FakeUserLoginHistoryService
            extends UserLoginHistoryService {
        /**
         * 最近一次删除截止时间。
         */
        private LocalDateTime cutoffTime;

        /**
         * 最近一次删除租户。
         */
        private Long tenantId;

        private FakeUserLoginHistoryService() {
            super(new LoginAuditRecordFactory());
        }

        @Override
        public long deleteHistoryBefore(LocalDateTime cutoffTime, Long tenantId) {
            this.cutoffTime = cutoffTime;
            this.tenantId = tenantId;
            return 12L;
        }
    }

    /**
     * 权限服务测试替身。
     */
    private static final class FakePermissionService extends PermissionService {
        /**
         * 当前用户角色编码。
         */
        private final List<String> roles;

        private FakePermissionService(List<String> roles) {
            super(null, null);
            this.roles = roles;
        }

        @Override
        public List<String> getUserRoles(String userId) {
            return roles;
        }
    }
}
