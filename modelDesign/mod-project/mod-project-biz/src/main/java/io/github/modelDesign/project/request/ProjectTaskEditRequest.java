package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 编辑项目任务请求。
 */
@Data
@Schema(description = "编辑项目任务请求")
public class ProjectTaskEditRequest {
    /**
     * 任务标题。
     */
    @Schema(description = "任务标题", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务标题不能为空")
    @Size(max = 128, message = "任务标题长度不能超过 128 个字符")
    private String title;

    /**
     * 任务描述。
     */
    @Schema(description = "任务描述")
    @Size(max = 1000, message = "任务描述长度不能超过 1000 个字符")
    private String description;

    /**
     * 任务状态。
     */
    @Schema(description = "任务状态", allowableValues = {"todo", "inProgress", "done", "canceled"}, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务状态不能为空")
    @Size(max = 32, message = "任务状态长度不能超过 32 个字符")
    private String status;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"}, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务优先级不能为空")
    @Size(max = 32, message = "任务优先级长度不能超过 32 个字符")
    private String priority;

    /**
     * 负责人 ID。
     */
    @Schema(description = "负责人 ID")
    private Long assigneeId;

    /**
     * 开始时间。
     */
    @Schema(description = "开始时间")
    private LocalDateTime startTime;

    /**
     * 截止时间。
     */
    @Schema(description = "截止时间")
    private LocalDateTime dueTime;
}
