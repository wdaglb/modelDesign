package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 项目任务详情。
 */
@Data
@Builder
@Schema(description = "项目任务详情")
public class ProjectTaskDetailVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long id;

    /**
     * 项目 ID。
     */
    @Schema(description = "项目 ID")
    private Long projectId;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题")
    private String title;

    /**
     * 任务描述。
     */
    @Schema(description = "任务描述")
    private String description;

    /**
     * 任务状态。
     */
    @Schema(description = "任务状态", allowableValues = {"todo", "inProgress", "done", "canceled"})
    private String status;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    private String priority;

    /**
     * 负责人 ID。
     */
    @Schema(description = "负责人 ID")
    private Long assigneeId;

    /**
     * 负责人名称。
     */
    @Schema(description = "负责人名称")
    private String assignee;

    /**
     * 创建人 ID。
     */
    @Schema(description = "创建人 ID")
    private Long creatorId;

    /**
     * 创建人名称。
     */
    @Schema(description = "创建人名称")
    private String creator;

    /**
     * 开始时间。
     */
    @Schema(description = "开始时间")
    private String startTime;

    /**
     * 截止时间。
     */
    @Schema(description = "截止时间")
    private String dueTime;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;
}
