package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑任务类型请求。
 */
@Data
@Schema(description = "编辑任务类型请求")
public class ProjectTaskTypeEditRequest {
    /**
     * 类型名称。
     */
    @Schema(description = "类型名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "类型名称不能为空")
    @Size(max = 64, message = "类型名称长度不能超过 64 个字符")
    private String name;

    /**
     * 排序值。
     */
    @Schema(description = "排序值", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "排序值不能为空")
    private Integer sort;

    /**
     * Git 分支前缀分组。
     */
    @Schema(description = "Git 分支前缀分组")
    @Size(max = 64, message = "Git 分支前缀分组长度不能超过 64 个字符")
    private String gitBranchPrefixGroup;
}
