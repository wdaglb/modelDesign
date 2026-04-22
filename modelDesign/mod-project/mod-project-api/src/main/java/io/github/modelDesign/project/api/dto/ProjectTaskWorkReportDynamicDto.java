package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 工作汇报中的动态项。
 */
@Data
@Builder
public class ProjectTaskWorkReportDynamicDto {
    /**
     * 所属任务 ID。
     */
    private Long taskId;

    /**
     * 所属项目名称。
     */
    private String projectName;

    /**
     * 所属任务标题。
     */
    private String taskTitle;

    /**
     * 动态发布人名称。
     */
    private String operatorName;

    /**
     * 动态发布时间。
     */
    private String createdAt;

    /**
     * 动态正文。
     */
    private String content;
}
