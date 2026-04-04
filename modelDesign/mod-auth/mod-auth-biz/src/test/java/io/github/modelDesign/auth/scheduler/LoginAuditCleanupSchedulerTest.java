package io.github.modelDesign.auth.scheduler;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.response.LoginAuditCleanupResultVo;
import io.github.modelDesign.auth.service.LoginAuditCleanupService;
import io.github.modelDesign.auth.service.LoginAuditRecordFactory;
import io.github.modelDesign.auth.service.UserLoginHistoryService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 登录审计清理调度器测试。
 */
class LoginAuditCleanupSchedulerTest {
    /**
     * 定时清理应按默认保留天数调用全局清理。
     */
    @Test
    void scheduledCleanupShouldInvokeGlobalCleanupWithDefaultRetentionDays() {
        AuthProperties properties = new AuthProperties();
        properties.setLoginAuditRetentionDays(90);
        FakeLoginAuditCleanupService cleanupService = new FakeLoginAuditCleanupService();
        LoginAuditCleanupScheduler scheduler = new LoginAuditCleanupScheduler(
                cleanupService,
                properties
        );

        scheduler.cleanupExpiredLoginAuditLogs();

        assertEquals(90, cleanupService.retentionDays);
        assertEquals(
                LoginAuditCleanupTriggerTypeEnum.SCHEDULED,
                cleanupService.triggerType
        );
    }

    /**
     * 登录审计清理服务测试替身。
     */
    private static final class FakeLoginAuditCleanupService extends LoginAuditCleanupService {
        /**
         * 最近一次保留天数。
         */
        private Integer retentionDays;

        /**
         * 最近一次触发类型。
         */
        private LoginAuditCleanupTriggerTypeEnum triggerType;

        private FakeLoginAuditCleanupService() {
            super(
                    new UserLoginHistoryService(new LoginAuditRecordFactory()),
                    new io.github.modelDesign.auth.service.PermissionService(null, null),
                    new AuthProperties()
            );
        }

        @Override
        public LoginAuditCleanupResultVo cleanupGlobal(Integer retentionDays,
                                                       Long operatorUserId,
                                                       Long operatorTenantId,
                                                       LoginAuditCleanupTriggerTypeEnum triggerType) {
            this.retentionDays = retentionDays;
            this.triggerType = triggerType;
            return LoginAuditCleanupResultVo.builder()
                    .deletedCount(0L)
                    .scope("GLOBAL")
                    .retentionDays(retentionDays)
                    .cutoffTime(LocalDateTime.now())
                    .triggerType(triggerType.name())
                    .build();
        }
    }
}
