package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务类型视图对象。
 */
@Data
@Builder
@Schema(description = "任务类型视图对象")
public class ProjectTaskTypeVo {
    /**
     * 类型 ID。
     */
    @Schema(description = "类型 ID")
    private Long id;

    /**
     * 类型名称。
     */
    @Schema(description = "类型名称")
    private String name;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort;
}
