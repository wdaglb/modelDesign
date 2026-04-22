package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 当前登录用户工作汇报结果。
 */
@Data
@Builder
public class ProjectTaskWorkReportDto {
    /**
     * 汇报类型。
     */
    private String reportType;

    /**
     * 汇报标题。
     */
    private String reportTitle;

    /**
     * 统计区间开始时间。
     */
    private String periodStart;

    /**
     * 统计区间结束时间。
     */
    private String periodEnd;

    /**
     * 汇报任务列表。
     */
    private List<ProjectTaskWorkReportTaskDto> tasks;

    /**
     * 汇报动态列表。
     */
    private List<ProjectTaskWorkReportDynamicDto> dynamics;
}
