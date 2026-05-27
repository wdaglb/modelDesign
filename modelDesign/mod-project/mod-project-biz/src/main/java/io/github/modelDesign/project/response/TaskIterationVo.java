package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 任务迭代视图对象。
 */
@Data
@Builder
@Schema(description = "任务迭代视图对象")
public class TaskIterationVo {
    /**
     * 迭代 ID。
     */
    @Schema(description = "迭代 ID")
    private Long id;

    /**
     * 迭代名称。
     */
    @Schema(description = "迭代名称")
    private String name;

    /**
     * 开始日期。
     */
    @Schema(description = "开始日期")
    private String startDate;

    /**
     * 结束日期。
     */
    @Schema(description = "结束日期")
    private String endDate;

    /**
     * 是否已发布。
     */
    @Schema(description = "是否已发布")
    private Boolean published;
}
