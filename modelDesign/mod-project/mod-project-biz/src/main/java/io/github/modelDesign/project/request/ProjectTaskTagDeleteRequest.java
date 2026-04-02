package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除任务标签请求。
 */
@Data
@Schema(description = "删除任务标签请求")
public class ProjectTaskTagDeleteRequest {
    /**
     * 标签 ID。
     */
    @Schema(description = "标签 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "标签 ID 不能为空")
    private Long id;
}
