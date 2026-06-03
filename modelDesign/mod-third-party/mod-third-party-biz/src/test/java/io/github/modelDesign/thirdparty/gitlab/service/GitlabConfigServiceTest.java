package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.gitlab.configuration.GitlabProperties;
import io.github.modelDesign.thirdparty.gitlab.domain.GitlabTenantConfig;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabConfigSaveRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * GitLab 配置服务测试。
 */
class GitlabConfigServiceTest {
    /**
     * 首次配置必须提供 Token，并且返回值只包含脱敏状态。
     */
    @Test
    void saveCurrentConfigShouldEncryptTokenAndMaskResponse() {
        InMemoryGitlabConfigService service = buildService();

        try {
            AuthContext.set(CurrentAdmin.builder().tenantId(1L).build());
            GitlabConfigSaveRequest request = request("https://gitlab.example.com/", "secret-token");

            var result = service.saveCurrentConfig(request);
            GitlabTenantConfig saved = service.findByTenantId(1L);

            assertEquals("https://gitlab.example.com", saved.getServerUrl());
            assertNotEquals("secret-token", saved.getAccessTokenCipher());
            assertTrue(result.getTokenConfigured());
            assertEquals("********", result.getTokenMasked());
        } finally {
            AuthContext.clear();
        }
    }

    /**
     * 更新配置时 Token 留空必须保留旧密文，避免用户只改地址或备注时误清空密钥。
     */
    @Test
    void saveCurrentConfigShouldKeepOldTokenWhenUpdateTokenIsBlank() {
        InMemoryGitlabConfigService service = buildService();

        try {
            AuthContext.set(CurrentAdmin.builder().tenantId(1L).build());
            service.saveCurrentConfig(request("https://gitlab.example.com", "secret-token"));
            String oldCipher = service.findByTenantId(1L).getAccessTokenCipher();

            GitlabConfigSaveRequest updateRequest = request("https://gitlab.internal", "");
            service.saveCurrentConfig(updateRequest);

            GitlabTenantConfig saved = service.findByTenantId(1L);
            assertEquals("https://gitlab.internal", saved.getServerUrl());
            assertEquals(oldCipher, saved.getAccessTokenCipher());
        } finally {
            AuthContext.clear();
        }
    }

    /**
     * 新建配置 Token 为空时直接拒绝，避免创建不可用且无法调用 GitLab 的配置。
     */
    @Test
    void saveCurrentConfigShouldRejectBlankTokenWhenCreate() {
        InMemoryGitlabConfigService service = buildService();

        try {
            AuthContext.set(CurrentAdmin.builder().tenantId(1L).build());

            assertThrows(
                    BusinessException.class,
                    () -> service.saveCurrentConfig(request("https://gitlab.example.com", ""))
            );
        } finally {
            AuthContext.clear();
        }
    }

    /**
     * 当前租户只能读取自己的配置。
     */
    @Test
    void getCurrentConfigShouldUseCurrentTenantOnly() {
        InMemoryGitlabConfigService service = buildService();

        try {
            AuthContext.set(CurrentAdmin.builder().tenantId(1L).build());
            service.saveCurrentConfig(request("https://tenant-one.example.com", "token-1"));

            AuthContext.set(CurrentAdmin.builder().tenantId(2L).build());
            assertThrows(BusinessException.class, service::getCurrentConfig);
        } finally {
            AuthContext.clear();
        }
    }

    private InMemoryGitlabConfigService buildService() {
        GitlabProperties properties = new GitlabProperties();
        properties.setTokenSecretKey("unit-test-gitlab-token-secret");
        return new InMemoryGitlabConfigService(
                new GitlabTenantContextService(),
                new GitlabTokenCipherService(properties)
        );
    }

    private GitlabConfigSaveRequest request(String serverUrl, String accessToken) {
        GitlabConfigSaveRequest request = new GitlabConfigSaveRequest();
        request.setServerUrl(serverUrl);
        request.setAccessToken(accessToken);
        request.setEnabled(true);
        request.setRemark("remark");
        return request;
    }
}
