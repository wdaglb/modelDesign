package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

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
     * 项目编号。
     */
    @Schema(description = "项目编号")
    private String projectCode;

    /**
     * 父任务 ID。
     */
    @Schema(description = "父任务 ID")
    private Long parentTaskId;

    /**
     * 父任务标题。
     */
    @Schema(description = "父任务标题")
    private String parentTaskTitle;

    /**
     * 子任务数量。
     */
    @Schema(description = "子任务数量")
    private Integer childTaskCount;

    /**
     * 已完成子任务数量。
     */
    @Schema(description = "已完成子任务数量")
    private Integer completedChildTaskCount;

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
     * 最新动态摘要。
     */
    @Schema(description = "最新动态摘要")
    private String latestDynamicSummary;

    /**
     * 任务类型 ID。
     */
    @Schema(description = "任务类型 ID")
    private Long typeId;

    /**
     * 任务类型名称。
     */
    @Schema(description = "任务类型名称")
    private String typeName;

    /**
     * 任务状态编码。
     */
    @Schema(description = "任务状态编码", allowableValues = {"todo", "inProgress", "pendingTest", "pendingRelease", "done", "canceled"})
    private String status;

    /**
     * 项目名称。
     */
    @Schema(description = "项目名称")
    private String projectName;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    private String priority;

    /**
     * 前置任务 ID 列表。
     */
    @Schema(description = "前置任务 ID 列表")
    private List<Long> predecessorTaskIds;

    /**
     * 前置任务详情列表。
     */
    @Schema(description = "前置任务详情列表")
    private List<ProjectTaskPredecessorVo> predecessorTasks;

    /**
     * 标签 ID 列表。
     */
    @Schema(description = "标签 ID 列表")
    private List<Long> tagIds;

    /**
     * 标签详情列表。
     */
    @Schema(description = "标签详情列表")
    private List<ProjectTaskTagVo> tags;

    /**
     * 是否可开始。
     */
    @Schema(description = "是否可开始")
    private Boolean canStart;

    /**
     * 阻塞原因。
     */
    @Schema(description = "阻塞原因")
    private String blockedReason;

    /**
     * 预计工时（人天）。
     */
    @Schema(description = "预计工时（人天）")
    private BigDecimal workDays;

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
     * 负责人最近一次被指派时间。
     */
    @Schema(description = "负责人最近一次被指派时间")
    private String assigneeAssignedAt;

    /**
     * 负责人指派已持续天数。
     */
    @Schema(description = "负责人指派已持续天数")
    private Integer assigneeElapsedDays;

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
     * 创建已持续天数。
     */
    @Schema(description = "创建已持续天数")
    private Integer createdElapsedDays;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;
}
