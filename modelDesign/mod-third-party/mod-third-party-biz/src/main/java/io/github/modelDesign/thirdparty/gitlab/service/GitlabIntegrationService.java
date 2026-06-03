package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.thirdparty.gitlab.client.GitlabClient;
import io.github.modelDesign.thirdparty.gitlab.client.GitlabCurrentUserResponse;
import io.github.modelDesign.thirdparty.gitlab.client.GitlabProjectPageResult;
import io.github.modelDesign.thirdparty.gitlab.client.GitlabProjectResponse;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabProjectListRequest;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabConnectionTestVo;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabPageResponse;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabProjectVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
     * GitLab API v4 客户端。
     */
    private final GitlabClient gitlabClient;

    /**
     * 测试当前租户 GitLab 连接。
     *
     * @return 连接测试结果
     */
    public GitlabConnectionTestVo testCurrentConnection() {
        GitlabResolvedConfig config = gitlabConfigService.requireCurrentResolvedConfig();
        GitlabCurrentUserResponse currentUser = gitlabClient.getCurrentUser(
                config.getServerUrl(),
                config.getAccessToken()
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
        GitlabProjectPageResult result = gitlabClient.listProjects(
                config.getServerUrl(),
                config.getAccessToken(),
                request.getCurrent(),
                request.getPageSize(),
                request.getKeyword()
        );
        return new GitlabPageResponse<>(
                result.getItems().stream().map(this::toProjectVo).toList(),
                result.getTotal()
        );
    }

    private GitlabProjectVo toProjectVo(GitlabProjectResponse project) {
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
}
