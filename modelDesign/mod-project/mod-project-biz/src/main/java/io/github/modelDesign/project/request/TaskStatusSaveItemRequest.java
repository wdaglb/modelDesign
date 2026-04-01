package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 任务状态保存项请求。
 */
@Data
@Schema(description = "任务状态保存项请求")
public class TaskStatusSaveItemRequest {
    /**
     * 状态编码。
     */
    @Schema(description = "状态编码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "状态编码不能为空")
    @Size(max = 32, message = "状态编码长度不能超过 32 个字符")
    private String code;

    /**
     * 状态名称。
     */
    @Schema(description = "状态名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "状态名称不能为空")
    @Size(max = 64, message = "状态名称长度不能超过 64 个字符")
    private String name;

    /**
     * 是否为完成状态。
     */
    @Schema(description = "是否为完成状态", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "完成状态标记不能为空")
    private Boolean isCompleted;
}
