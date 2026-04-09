package io.github.modelDesign.auth.scheduler;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.service.LoginAuditCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 登录审计清理调度器。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoginAuditCleanupScheduler {
    /**
     * 登录审计清理服务。
     */
    private final LoginAuditCleanupService loginAuditCleanupService;

    /**
     * 认证配置。
     */
    private final AuthProperties authProperties;

    /**
     * 每日定时清理过期登录审计日志。
     */
    @Scheduled(cron = "${model-design.auth.login-audit-cleanup-cron:0 30 3 * * *}")
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
