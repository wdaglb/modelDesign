package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务前置任务视图对象。
 */
@Data
@Builder
@Schema(description = "任务前置任务视图对象")
public class ProjectTaskPredecessorVo {
    /**
     * 前置任务 ID。
     */
    @Schema(description = "前置任务 ID")
    private Long taskId;

    /**
     * 前置任务标题。
     */
    @Schema(description = "前置任务标题")
    private String title;

    /**
     * 前置任务状态。
     */
    @Schema(description = "前置任务状态")
    private String status;
}
