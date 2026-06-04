package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabCurrentUserResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;
import io.github.modelDesign.thirdparty.gitlab.provider.GitlabProviderRegistry;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabProjectListRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * GitLab 集成服务测试。
 */
class GitlabIntegrationServiceTest {
    /**
     * 测试连接时应按租户配置选择 provider。
     */
    @Test
    void testCurrentConnectionShouldUseConfiguredProvider() {
        GitlabConfigService configService = mock(GitlabConfigService.class);
        GitlabProviderRegistry registry = mock(GitlabProviderRegistry.class);
        GitlabApiProvider provider = mock(GitlabApiProvider.class);
        when(configService.requireCurrentResolvedConfig()).thenReturn(resolvedConfig());
        when(registry.getProvider("gitlab-v4", "1.0.0")).thenReturn(provider);
        when(provider.getCurrentUser(org.mockito.ArgumentMatchers.any()))
                .thenReturn(GitlabCurrentUserResult.builder()
                        .username("alice")
                        .name("Alice")
                        .webUrl("https://gitlab.example.com/alice")
                        .build());
        GitlabIntegrationService service = new GitlabIntegrationService(configService, registry);

        var result = service.testCurrentConnection();

        verify(registry).getProvider(eq("gitlab-v4"), eq("1.0.0"));
        assertEquals("alice", result.getUsername());
        assertEquals("GitLab 连接成功", result.getMessage());
    }

    /**
     * 查询项目时应将租户配置转换为 provider 调用上下文。
     */
    @Test
    void listCurrentProjectsShouldMapProviderProjects() {
        GitlabConfigService configService = mock(GitlabConfigService.class);
        GitlabProviderRegistry registry = mock(GitlabProviderRegistry.class);
        GitlabApiProvider provider = mock(GitlabApiProvider.class);
        when(configService.requireCurrentResolvedConfig()).thenReturn(resolvedConfig());
        when(registry.getProvider("gitlab-v4", "1.0.0")).thenReturn(provider);
        when(provider.listProjects(
                org.mockito.ArgumentMatchers.any(GitlabProviderContext.class),
                org.mockito.ArgumentMatchers.any(GitlabProjectQuery.class)
        )).thenReturn(new GitlabProjectPageResult(
                List.of(GitlabProjectResult.builder()
                        .id(11L)
                        .name("服务端")
                        .pathWithNamespace("group/server")
                        .webUrl("https://gitlab.example.com/group/server")
                        .visibility("private")
                        .defaultBranch("main")
                        .lastActivityAt("2026-06-03T00:00:00Z")
                        .build()),
                1L
        ));
        GitlabIntegrationService service = new GitlabIntegrationService(configService, registry);
        GitlabProjectListRequest request = new GitlabProjectListRequest();
        request.setCurrent(1);
        request.setPageSize(20);
        request.setKeyword("server");

        var result = service.listCurrentProjects(request);

        assertEquals(1L, result.getTotal());
        assertEquals(11L, result.getItems().get(0).getId());
        assertEquals("group/server", result.getItems().get(0).getPathWithNamespace());
    }

    private GitlabResolvedConfig resolvedConfig() {
        return new GitlabResolvedConfig(
                1001L,
                "https://gitlab.example.com",
                "token-1",
                "gitlab-v4",
                "1.0.0"
        );
    }
}
