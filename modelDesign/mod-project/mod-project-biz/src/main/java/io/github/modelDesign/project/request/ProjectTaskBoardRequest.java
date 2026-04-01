package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 敏捷面板任务列表请求。
 */
@Data
@Schema(description = "敏捷面板任务列表请求")
public class ProjectTaskBoardRequest {
    /**
     * 项目 ID。
     */
    @Schema(description = "项目 ID")
    private Long projectId;

    /**
     * 任务标题关键字。
     */
    @Schema(description = "任务标题关键字")
    @Size(max = 128, message = "任务标题长度不能超过 128 个字符")
    private String title;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    @Size(max = 32, message = "任务优先级长度不能超过 32 个字符")
    private String priority;

    /**
     * 负责人 ID。
     */
    @Schema(description = "负责人 ID")
    private Long assigneeId;
}
