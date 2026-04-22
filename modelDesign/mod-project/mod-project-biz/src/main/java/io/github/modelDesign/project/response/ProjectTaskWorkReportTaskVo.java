package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 工作报表任务项。
 */
@Data
@Builder
@Schema(description = "工作报表任务项")
public class ProjectTaskWorkReportTaskVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long id;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称")
    private String projectName;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题")
    private String title;

    /**
     * 参与身份。
     */
    @Schema(description = "参与身份")
    private String participationRole;

    /**
     * 任务状态。
     */
    @Schema(description = "任务状态")
    private String status;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级")
    private String priority;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;

    /**
     * 最新动态摘要。
     */
    @Schema(description = "最新动态摘要")
    private String latestDynamicSummary;
}
