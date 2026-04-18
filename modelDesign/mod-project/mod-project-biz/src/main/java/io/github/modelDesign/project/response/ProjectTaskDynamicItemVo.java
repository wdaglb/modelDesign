package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务动态列表项。
 */
@Data
@Builder
@Schema(description = "任务动态列表项")
public class ProjectTaskDynamicItemVo {
    /**
     * 动态 ID。
     */
    @Schema(description = "动态 ID")
    private Long id;

    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long taskId;

    /**
     * 动态内容。
     */
    @Schema(description = "动态内容")
    private String content;

    /**
     * 发布人 ID。
     */
    @Schema(description = "发布人 ID")
    private Long operatorId;

    /**
     * 发布人名称。
     */
    @Schema(description = "发布人名称")
    private String operatorName;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;
}
