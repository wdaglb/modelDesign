package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务变更日志内容项。
 */
@Data
@Builder
@Schema(description = "任务变更日志内容项")
public class ProjectTaskChangeItemVo {
    /**
     * 字段编码。
     */
    @Schema(description = "字段编码")
    private String field;

    /**
     * 字段名称。
     */
    @Schema(description = "字段名称")
    private String label;

    /**
     * 变更前展示值。
     */
    @Schema(description = "变更前展示值")
    private String beforeValue;

    /**
     * 变更后展示值。
     */
    @Schema(description = "变更后展示值")
    private String afterValue;
}
