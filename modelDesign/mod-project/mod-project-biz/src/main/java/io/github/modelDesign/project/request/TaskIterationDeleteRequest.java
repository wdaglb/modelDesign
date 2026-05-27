package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除任务迭代请求。
 */
@Data
@Schema(description = "删除任务迭代请求")
public class TaskIterationDeleteRequest {
    /**
     * 迭代 ID。
     */
    @Schema(description = "迭代 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "迭代 ID 不能为空")
    private Long id;
}
