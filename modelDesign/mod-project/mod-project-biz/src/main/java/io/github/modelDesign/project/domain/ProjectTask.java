package io.github.modelDesign.project.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 项目任务。
 */
@Data
@TableName("projectTask")
@EqualsAndHashCode(callSuper = true)
public class ProjectTask extends BaseEntity {
    /**
     * 项目 ID。
     */
    private Long projectId;

    /**
     * 父任务 ID。
     */
    private Long parentTaskId;

    /**
     * 任务标题。
     */
    private String title;

    /**
     * 任务描述。
     */
    private String description;

    /**
     * 任务类型 ID。
     */
    private Long typeId;

    /**
     * 任务迭代 ID。
     */
    private Long iterationId;

    /**
     * 任务状态。
     */
    private String status;

    /**
     * 任务优先级。
     */
    private String priority;

    /**
     * 创建人 ID。
     */
    private Long creatorId;

    /**
     * 负责人 ID。
     */
    private Long assigneeId;

    /**
     * 当前负责人最近一次被指派时间。
     */
    private LocalDateTime assigneeAssignedAt;

    /**
     * 预计工时（人天）。
     */
    private BigDecimal workDays;

    /**
     * 开始时间。
     */
    private LocalDateTime startTime;

    /**
     * 截止时间。
     */
    private LocalDateTime dueTime;

    /**
     * 逻辑删除标记。
     */
    private Integer deleted;
}
