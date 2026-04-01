package io.github.modelDesign.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 项目任务列表请求。
 */
@Data
@Schema(description = "项目任务列表请求")
public class ProjectTaskListRequest {
    /**
     * 项目 ID。
     */
    @Schema(description = "项目 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "项目 ID 不能为空")
    private Long projectId;

    /**
     * 当前页码。
     */
    @Schema(description = "当前页码")
    @Min(value = 1, message = "当前页码必须大于 0")
    private Integer current = 1;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数必须大于 0")
    private Integer pageSize = 10;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题")
    @Size(max = 128, message = "任务标题长度不能超过 128 个字符")
    private String title;

    /**
     * 任务状态编码。
     */
    @Schema(description = "任务状态编码", allowableValues = {"todo", "inProgress", "pendingTest", "pendingRelease", "done", "canceled"})
    @Size(max = 32, message = "任务状态长度不能超过 32 个字符")
    private String status;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    @Size(max = 32, message = "任务优先级长度不能超过 32 个字符")
    private String priority;

    /**
     * 负责人 ID。
     */
    @Schema(description = "负责人 ID")
    private Long assigneeId;

    /**
     * 排序字段。
     */
    @Schema(description = "排序字段", allowableValues = {"priority", "startTime"})
    @Size(max = 32, message = "排序字段长度不能超过 32 个字符")
    private String sortField;

    /**
     * 排序方向。
     */
    @Schema(description = "排序方向", allowableValues = {"asc", "desc"})
    @Size(max = 8, message = "排序方向长度不能超过 8 个字符")
    private String sortOrder;
}
