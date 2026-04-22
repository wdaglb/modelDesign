package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 工作汇报中的任务项。
 */
@Data
@Builder
public class ProjectTaskWorkReportTaskDto {
    /**
     * 任务 ID。
     */
    private Long id;

    /**
     * 项目名称。
     */
    private String projectName;

    /**
     * 任务标题。
     */
    private String title;

    /**
     * 当前用户参与身份。
     */
    private String participationRole;

    /**
     * 任务状态。
     */
    private String status;

    /**
     * 任务优先级。
     */
    private String priority;

    /**
     * 更新时间。
     */
    private String updatedAt;

    /**
     * 最新动态摘要。
     */
    private String latestDynamicSummary;
}
