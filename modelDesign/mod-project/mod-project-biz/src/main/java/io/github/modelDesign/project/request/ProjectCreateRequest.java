package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 创建项目请求。
 */
@Data
@Schema(description = "创建项目请求")
public class ProjectCreateRequest {
    /**
     * 项目编号。
     */
    @Schema(description = "项目编号", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "项目编号不能为空")
    @Size(max = 64, message = "项目编号长度不能超过 64 个字符")
    private String code;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "项目名称不能为空")
    @Size(max = 128, message = "项目名称长度不能超过 128 个字符")
    private String name;

    /**
     * 项目描述。
     */
    @Schema(description = "项目描述")
    @Size(max = 1000, message = "项目描述长度不能超过 1000 个字符")
    private String description;

    /**
     * 项目状态。
     */
    @Schema(description = "项目状态", allowableValues = {"planning", "inProgress", "atRisk", "archived"})
    @Size(max = 32, message = "项目状态长度不能超过 32 个字符")
    private String status;

    /**
     * 项目分组。
     */
    @Schema(description = "项目分组")
    @Size(max = 64, message = "项目分组长度不能超过 64 个字符")
    private String projectGroup;

    /**
     * 当前进展。
     */
    @Schema(description = "当前进展")
    @Size(max = 1000, message = "当前进展长度不能超过 1000 个字符")
    private String progressSummary;

    /**
     * 已完成模块数。
     */
    @Schema(description = "已完成模块数")
    @Min(value = 0, message = "已完成模块数不能小于 0")
    private Integer completedModuleCount;

    /**
     * 数据库类型。
     */
    @Schema(description = "数据库类型", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "数据库类型不能为空")
    @Size(max = 32, message = "数据库类型长度不能超过 32 个字符")
    private String dbType;

    /**
     * GitLab 仓库绑定列表。
     */
    @Valid
    @Schema(description = "GitLab 仓库绑定列表")
    private List<@Valid ProjectGitlabRepositoryBindRequest> gitlabRepositories;
}
