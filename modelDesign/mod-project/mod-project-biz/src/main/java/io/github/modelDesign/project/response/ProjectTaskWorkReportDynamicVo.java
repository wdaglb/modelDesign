package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 工作报表动态项。
 */
@Data
@Builder
@Schema(description = "工作报表动态项")
public class ProjectTaskWorkReportDynamicVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long taskId;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称")
    private String projectName;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题")
    private String taskTitle;

    /**
     * 发布人名称。
     */
    @Schema(description = "发布人名称")
    private String operatorName;

    /**
     * 发布时间。
     */
    @Schema(description = "发布时间")
    private String createdAt;

    /**
     * 动态内容。
     */
    @Schema(description = "动态内容")
    private String content;
}
