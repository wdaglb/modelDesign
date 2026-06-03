package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 项目 GitLab 仓库绑定请求项。
 */
@Data
@Schema(description = "项目 GitLab 仓库绑定请求项")
public class ProjectGitlabRepositoryBindRequest {
    /**
     * GitLab 项目 ID。
     */
    @Schema(description = "GitLab 项目 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "GitLab 项目 ID 不能为空")
    @Positive(message = "GitLab 项目 ID 必须大于 0")
    private Long gitlabProjectId;

    /**
     * GitLab 项目名称快照。
     */
    @Schema(description = "GitLab 项目名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "GitLab 项目名称不能为空")
    @Size(max = 255, message = "GitLab 项目名称长度不能超过 255 个字符")
    private String name;

    /**
     * GitLab 完整命名空间路径快照。
     */
    @Schema(description = "GitLab 完整命名空间路径", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "GitLab 完整命名空间路径不能为空")
    @Size(max = 500, message = "GitLab 完整命名空间路径长度不能超过 500 个字符")
    private String pathWithNamespace;

    /**
     * GitLab 项目网页地址快照。
     */
    @Schema(description = "GitLab 项目网页地址", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "GitLab 项目网页地址不能为空")
    @Size(max = 1000, message = "GitLab 项目网页地址长度不能超过 1000 个字符")
    private String webUrl;
}
