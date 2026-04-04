package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.github.modelDesign.auth.enums.LoginAuditCleanupTriggerTypeEnum;
import io.github.modelDesign.auth.response.LoginAuditCleanupResultVo;
import io.github.modelDesign.auth.service.LoginAuditCleanupService;
import io.github.modelDesign.auth.service.LoginAuditRecordFactory;
import io.github.modelDesign.auth.service.UserLoginHistoryService;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.handler.GlobalExceptionHandler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 登录审计控制器测试。
 */
class LoginAuditControllerTest {
    /**
     * 测试后清理登录上下文。
     */
    @AfterEach
    void tearDown() {
        AuthContext.clear();
    }

    /**
     * 全局清理应返回删除数量。
     */
    @Test
    void cleanupShouldReturnDeletedCountForGlobalScope() throws Exception {
        FakeLoginAuditCleanupService cleanupService = new FakeLoginAuditCleanupService();
        cleanupService.globalResult = LoginAuditCleanupResultVo.builder()
                .deletedCount(12L)
                .scope("GLOBAL")
                .retentionDays(90)
                .cutoffTime(LocalDateTime.of(2026, 1, 1, 0, 0))
                .triggerType(LoginAuditCleanupTriggerTypeEnum.MANUAL.name())
                .build();

        LoginAuditController controller = new LoginAuditController(
                new UserLoginHistoryService(new LoginAuditRecordFactory()),
                cleanupService
        );
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        AuthContext.set(CurrentAdmin.builder().userId(1L).tenantId(1001L).build());

        mockMvc.perform(post("/login_audit/cleanup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scope\":\"GLOBAL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedCount").value(12))
                .andExpect(jsonPath("$.scope").value("GLOBAL"));
    }

    /**
     * 租户范围缺少租户 ID 时应被校验拒绝。
     */
    @Test
    void cleanupShouldRejectTenantScopeWithoutTenantId() throws Exception {
        LoginAuditController controller = new LoginAuditController(
                new UserLoginHistoryService(new LoginAuditRecordFactory()),
                new FakeLoginAuditCleanupService()
        );
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        AuthContext.set(CurrentAdmin.builder().userId(2L).tenantId(2001L).build());

        mockMvc.perform(post("/login_audit/cleanup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scope\":\"TENANT\"}"))
                .andExpect(status().isBadRequest());
    }

    /**
     * 登录审计清理服务测试替身。
     */
    private static final class FakeLoginAuditCleanupService extends LoginAuditCleanupService {
        /**
         * 全局清理返回值。
         */
        private LoginAuditCleanupResultVo globalResult;

        /**
         * 租户清理返回值。
         */
        private LoginAuditCleanupResultVo tenantResult;

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
            return globalResult;
        }

        @Override
        public LoginAuditCleanupResultVo cleanupByTenant(Long tenantId,
                                                         Integer retentionDays,
                                                         Long operatorUserId,
                                                         Long operatorTenantId,
                                                         LoginAuditCleanupTriggerTypeEnum triggerType) {
            return tenantResult;
        }
    }
}
