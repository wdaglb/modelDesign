package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务标签视图对象。
 */
@Data
@Builder
@Schema(description = "任务标签视图对象")
public class ProjectTaskTagVo {
    /**
     * 标签 ID。
     */
    @Schema(description = "标签 ID")
    private Long id;

    /**
     * 标签名称。
     */
    @Schema(description = "标签名称")
    private String name;

    /**
     * 标签颜色。
     */
    @Schema(description = "标签颜色")
    private String color;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort;
}
