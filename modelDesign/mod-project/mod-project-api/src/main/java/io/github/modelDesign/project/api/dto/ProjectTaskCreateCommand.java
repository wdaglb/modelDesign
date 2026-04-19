package io.github.modelDesign.project.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 项目任务创建命令。
 */
@Data
public class ProjectTaskCreateCommand {
    /**
     * 项目 ID。
     */
    private Long projectId;

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
     * 类型 ID。
     */
    private Long typeId;

    /**
     * 状态编码。
     */
    private String status;

    /**
     * 优先级编码。
     */
    private String priority;

    /**
     * 预计工时。
     */
    private BigDecimal workDays;

    /**
     * 负责人 ID。
     */
    private Long assigneeId;

    /**
     * 开始时间。
     */
    private LocalDateTime startTime;

    /**
     * 截止时间。
     */
    private LocalDateTime dueTime;
}
