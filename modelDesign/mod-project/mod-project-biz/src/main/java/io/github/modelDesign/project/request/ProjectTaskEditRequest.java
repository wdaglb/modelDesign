package io.github.modelDesign.project.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 编辑项目任务请求。
 */
@Data
@Schema(description = "编辑项目任务请求")
public class ProjectTaskEditRequest {
    /**
     * 父任务 ID。
     */
    @Schema(description = "父任务 ID")
    private Long parentTaskId;

    /**
     * 前置任务 ID 列表。
     */
    @Schema(description = "前置任务 ID 列表")
    private List<Long> predecessorTaskIds;

    /**
     * 标签 ID 列表。
     */
    @Schema(description = "标签 ID 列表")
    private List<Long> tagIds;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务标题不能为空")
    @Size(max = 128, message = "任务标题长度不能超过 128 个字符")
    private String title;

    /**
     * 任务描述。
     */
    @Schema(description = "任务描述")
    private String description;

    /**
     * 任务类型 ID。
     */
    @Schema(description = "任务类型 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "任务类型不能为空")
    private Long typeId;

    /**
     * 任务状态编码。
     */
    @Schema(description = "任务状态编码", allowableValues = {"todo", "inProgress", "pendingTest", "pendingRelease", "done", "canceled"}, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务状态不能为空")
    @Size(max = 32, message = "任务状态长度不能超过 32 个字符")
    private String status;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"}, requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务优先级不能为空")
    @Size(max = 32, message = "任务优先级长度不能超过 32 个字符")
    private String priority;

    /**
     * 预计工时（人天）。
     */
    @Schema(description = "预计工时（人天）", example = "1.5")
    private BigDecimal workDays;

    /**
     * 负责人 ID。
     */
    @JsonDeserialize(using = AssigneeIdDeserializer.class)
    @Schema(description = "负责人 ID，传 0 表示未分配")
    private Long assigneeId;

    /**
     * 开始时间。
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "开始时间", example = "2026-04-10 00:00:00")
    private LocalDateTime startTime;

    /**
     * 截止时间。
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "截止时间", example = "2026-04-10 00:00:00")
    private LocalDateTime dueTime;
}
