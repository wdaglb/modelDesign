package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 我的待办列表项。
 */
@Data
@Builder
@Schema(description = "我的待办列表项")
public class MyTodoItemVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long id;

    /**
     * 任务标题。
     */
    @Schema(description = "任务标题")
    private String title;

    /**
     * 最新动态摘要。
     */
    @Schema(description = "最新动态摘要")
    private String latestDynamicSummary;

    /**
     * 接收时间（任务创建时间）。
     */
    @Schema(description = "接收时间")
    private String receivedAt;

    /**
     * 任务优先级。
     */
    @Schema(description = "任务优先级", allowableValues = {"low", "medium", "high"})
    private String priority;

    /**
     * 预计工时（人天）。
     */
    @Schema(description = "预计工时（人天）")
    private BigDecimal workDays;

    /**
     * 任务状态编码。
     */
    @Schema(description = "任务状态编码", allowableValues = {"todo", "inProgress", "pendingTest", "pendingRelease", "done", "canceled"})
    private String status;

    /**
     * 发起人名称（任务创建人）。
     */
    @Schema(description = "发起人名称")
    private String initiatorName;

    /**
     * 所属项目 ID。
     */
    @Schema(description = "所属项目 ID")
    private Long projectId;

    /**
     * 所属项目名称。
     */
    @Schema(description = "所属项目名称")
    private String projectName;
}
