package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 任务变更日志列表项。
 */
@Data
@Builder
@Schema(description = "任务变更日志列表项")
public class ProjectTaskChangeLogItemVo {
    /**
     * 日志 ID。
     */
    @Schema(description = "日志 ID")
    private Long id;

    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long taskId;

    /**
     * 操作类型。
     */
    @Schema(description = "操作类型")
    private String operationType;

    /**
     * 操作文案。
     */
    @Schema(description = "操作文案")
    private String operationText;

    /**
     * 操作人 ID。
     */
    @Schema(description = "操作人 ID")
    private Long operatorId;

    /**
     * 操作人名称。
     */
    @Schema(description = "操作人名称")
    private String operatorName;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;

    /**
     * 变更内容。
     */
    @Schema(description = "变更内容")
    private List<ProjectTaskChangeItemVo> changes;
}
