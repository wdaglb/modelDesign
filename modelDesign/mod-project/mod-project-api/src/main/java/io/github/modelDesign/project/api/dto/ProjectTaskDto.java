package io.github.modelDesign.project.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 面向外部聚合层的任务结果。
 */
@Data
@Builder
public class ProjectTaskDto {
    /**
     * 任务 ID。
     */
    private Long id;

    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 项目名称。
     */
    private String projectName;

    /**
     * 父任务 ID。
     */
    private Long parentTaskId;

    /**
     * 标题。
     */
    private String title;

    /**
     * 描述。
     */
    private String description;

    /**
     * 最新动态摘要。
     */
    private String latestDynamicSummary;

    /**
     * 类型 ID。
     */
    private Long typeId;

    /**
     * 类型名称。
     */
    private String typeName;

    /**
     * 任务迭代 ID。
     */
    private Long iterationId;

    /**
     * 任务迭代名称。
     */
    private String iterationName;

    /**
     * 状态编码。
     */
    private String status;

    /**
     * 优先级编码。
     */
    private String priority;

    /**
     * 是否可开始。
     */
    private Boolean canStart;

    /**
     * 阻塞原因。
     */
    private String blockedReason;

    /**
     * 预计工时。
     */
    private BigDecimal workDays;

    /**
     * 负责人 ID。
     */
    private Long assigneeId;

    /**
     * 负责人名称。
     */
    private String assigneeName;

    /**
     * 创建人 ID。
     */
    private Long creatorId;

    /**
     * 创建人名称。
     */
    private String creatorName;

    /**
     * 开始时间。
     */
    private String startTime;

    /**
     * 截止时间。
     */
    private String dueTime;

    /**
     * 创建时间。
     */
    private String createdAt;

    /**
     * 更新时间。
     */
    private String updatedAt;
}
