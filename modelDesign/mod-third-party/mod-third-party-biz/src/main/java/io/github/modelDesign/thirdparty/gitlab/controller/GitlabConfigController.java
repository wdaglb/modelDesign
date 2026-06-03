package io.github.modelDesign.thirdparty.gitlab.controller;

import io.github.modelDesign.thirdparty.gitlab.request.GitlabConfigSaveRequest;
import io.github.modelDesign.thirdparty.gitlab.request.GitlabProjectListRequest;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabConfigVo;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabConnectionTestVo;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabPageResponse;
import io.github.modelDesign.thirdparty.gitlab.response.GitlabProjectVo;
import io.github.modelDesign.thirdparty.gitlab.service.GitlabConfigService;
import io.github.modelDesign.thirdparty.gitlab.service.GitlabIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GitLab 配置接口。
 */
@Tag(name = "GitLab 配置")
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/third-party/gitlab/config")
public class GitlabConfigController {
    /**
     * GitLab 配置服务。
     */
    private final GitlabConfigService gitlabConfigService;

    /**
     * GitLab 集成服务。
     */
    private final GitlabIntegrationService gitlabIntegrationService;

    /**
     * 获取当前租户 GitLab 配置。
     *
     * @return GitLab 配置脱敏信息
     */
    @Operation(summary = "获取当前租户 GitLab 配置")
    @GetMapping("/current")
    public GitlabConfigVo current() {
        return gitlabConfigService.getCurrentConfig();
    }

    /**
     * 保存当前租户 GitLab 配置。
     *
     * @param request 保存请求
     * @return GitLab 配置脱敏信息
     */
    @Operation(summary = "保存当前租户 GitLab 配置")
    @PostMapping("/save")
    public GitlabConfigVo save(@Valid @RequestBody GitlabConfigSaveRequest request) {
        return gitlabConfigService.saveCurrentConfig(request);
    }

    /**
     * 测试当前租户 GitLab 连接。
     *
     * @return 连接测试结果
     */
    @Operation(summary = "测试当前租户 GitLab 连接")
    @PostMapping("/test-connection")
    public GitlabConnectionTestVo testConnection() {
        return gitlabIntegrationService.testCurrentConnection();
    }

    /**
     * 查询当前租户 GitLab 项目列表。
     *
     * @param request 项目列表请求
     * @return GitLab 项目分页
     */
    @Operation(summary = "查询当前租户 GitLab 项目列表")
    @GetMapping("/projects")
    public GitlabPageResponse<GitlabProjectVo> projects(@Valid GitlabProjectListRequest request) {
        return gitlabIntegrationService.listCurrentProjects(request);
    }
}
