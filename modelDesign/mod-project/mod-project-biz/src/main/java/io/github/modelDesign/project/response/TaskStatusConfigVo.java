package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务状态配置视图对象。
 */
@Data
@Builder
@Schema(description = "任务状态配置")
public class TaskStatusConfigVo {
    /**
     * 状态编码。
     */
    @Schema(description = "状态编码")
    private String code;

    /**
     * 状态名称。
     */
    @Schema(description = "状态名称")
    private String name;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort;

    /**
     * 是否为完成状态。
     */
    @Schema(description = "是否为完成状态")
    private Boolean isCompleted;
}
