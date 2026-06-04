package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabApiProvider;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabCurrentUserResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectQuery;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProjectResult;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderContext;
import io.github.modelDesign.thirdparty.api.gitlab.GitlabProviderException;
import io.github.modelDesign.thirdparty.gitlab.provider.GitlabProviderRegistry;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabProjectListRequest;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabConnectionTestVo;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabPageResponse;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabProjectVo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * GitLab 集成服务。
 */
@Service
@RequiredArgsConstructor
public class GitlabIntegrationService {
    /**
     * GitLab 配置服务。
     */
    private final GitlabConfigService gitlabConfigService;

    /**
     * GitLab provider 注册表。
     */
    private final GitlabProviderRegistry gitlabProviderRegistry;

    /**
     * 测试当前租户 GitLab 连接。
     *
     * @return 连接测试结果
     */
    public GitlabConnectionTestVo testCurrentConnection() {
        GitlabResolvedConfig config = gitlabConfigService.requireCurrentResolvedConfig();
        GitlabApiProvider provider = resolveProvider(config);
        GitlabCurrentUserResult currentUser = callProvider(
                () -> provider.getCurrentUser(toProviderContext(config))
        );
        return GitlabConnectionTestVo.builder()
                .success(true)
                .username(currentUser.getUsername())
                .name(currentUser.getName())
                .webUrl(currentUser.getWebUrl())
                .message("GitLab 连接成功")
                .build();
    }

    /**
     * 查询当前租户 GitLab 项目列表。
     *
     * @param request 项目列表请求
     * @return GitLab 项目分页
     */
    public GitlabPageResponse<GitlabProjectVo> listCurrentProjects(GitlabProjectListRequest request) {
        GitlabResolvedConfig config = gitlabConfigService.requireCurrentResolvedConfig();
        GitlabApiProvider provider = resolveProvider(config);
        GitlabProjectPageResult result = callProvider(
                () -> provider.listProjects(
                        toProviderContext(config),
                        GitlabProjectQuery.builder()
                                .current(request.getCurrent())
                                .pageSize(request.getPageSize())
                                .keyword(request.getKeyword())
                                .build()
                )
        );
        return new GitlabPageResponse<>(
                result.getItems().stream().map(this::toProjectVo).toList(),
                result.getTotal()
        );
    }

    private GitlabApiProvider resolveProvider(GitlabResolvedConfig config) {
        return gitlabProviderRegistry.getProvider(
                config.getProviderCode(),
                config.getProviderVersion()
        );
    }

    private GitlabProviderContext toProviderContext(GitlabResolvedConfig config) {
        return GitlabProviderContext.builder()
                .serverUrl(config.getServerUrl())
                .accessToken(config.getAccessToken())
                .build();
    }

    private <T> T callProvider(GitlabProviderCall<T> call) {
        try {
            return call.execute();
        } catch (GitlabProviderException exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY.value(), exception.getMessage());
        }
    }

    private GitlabProjectVo toProjectVo(GitlabProjectResult project) {
        return GitlabProjectVo.builder()
                .id(project.getId())
                .name(project.getName())
                .pathWithNamespace(project.getPathWithNamespace())
                .webUrl(project.getWebUrl())
                .visibility(project.getVisibility())
                .defaultBranch(project.getDefaultBranch())
                .lastActivityAt(project.getLastActivityAt())
                .build();
    }

    /**
     * GitLab provider 调用函数。
     *
     * @param <T> 返回值类型
     */
    private interface GitlabProviderCall<T> {
        /**
         * 执行 provider 调用。
         *
         * @return provider 调用结果
         */
        T execute();
    }
}
