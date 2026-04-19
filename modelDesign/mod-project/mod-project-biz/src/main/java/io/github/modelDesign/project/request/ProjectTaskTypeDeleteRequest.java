package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除任务类型请求。
 */
@Data
@Schema(description = "删除任务类型请求")
public class ProjectTaskTypeDeleteRequest {
    /**
     * 类型 ID。
     */
    @Schema(description = "类型 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "类型 ID 不能为空")
    private Long id;
}
