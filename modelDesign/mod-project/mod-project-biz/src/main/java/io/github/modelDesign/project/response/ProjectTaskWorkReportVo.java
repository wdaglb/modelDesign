package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 工作报表结果。
 */
@Data
@Builder
@Schema(description = "工作报表结果")
public class ProjectTaskWorkReportVo {
    /**
     * 报表类型。
     */
    @Schema(description = "报表类型")
    private String reportType;

    /**
     * 报表标题。
     */
    @Schema(description = "报表标题")
    private String reportTitle;

    /**
     * 统计区间开始时间。
     */
    @Schema(description = "统计区间开始时间")
    private String periodStart;

    /**
     * 统计区间结束时间。
     */
    @Schema(description = "统计区间结束时间")
    private String periodEnd;

    /**
     * 任务列表。
     */
    @Schema(description = "任务列表")
    private List<ProjectTaskWorkReportTaskVo> tasks;

    /**
     * 动态列表。
     */
    @Schema(description = "动态列表")
    private List<ProjectTaskWorkReportDynamicVo> dynamics;
}
