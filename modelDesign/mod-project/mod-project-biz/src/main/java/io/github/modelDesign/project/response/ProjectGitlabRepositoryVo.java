package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 项目 GitLab 仓库绑定响应项。
 */
@Data
@Builder
@Schema(description = "项目 GitLab 仓库绑定响应项")
public class ProjectGitlabRepositoryVo {
    /**
     * GitLab 项目 ID。
     */
    @Schema(description = "GitLab 项目 ID")
    private Long gitlabProjectId;

    /**
     * GitLab 项目名称快照。
     */
    @Schema(description = "GitLab 项目名称")
    private String name;

    /**
     * GitLab 完整命名空间路径快照。
     */
    @Schema(description = "GitLab 完整命名空间路径")
    private String pathWithNamespace;

    /**
     * GitLab 项目网页地址快照。
     */
    @Schema(description = "GitLab 项目网页地址")
    private String webUrl;
}
