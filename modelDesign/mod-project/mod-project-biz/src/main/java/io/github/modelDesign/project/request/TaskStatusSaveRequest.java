package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 任务状态整表保存请求。
 */
@Data
@Schema(description = "任务状态整表保存请求")
public class TaskStatusSaveRequest {
    /**
     * 状态列表。
     */
    @Schema(description = "状态列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @Valid
    @NotEmpty(message = "状态列表不能为空")
    private List<@Valid TaskStatusSaveItemRequest> statuses;
}
