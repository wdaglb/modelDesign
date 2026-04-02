package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 项目状态统计。
 */
@Data
@Builder
@Schema(description = "项目状态统计")
public class ProjectStatusSummaryVo {
    /**
     * 全部项目数量。
     */
    @Schema(description = "全部项目数量")
    private Long all;

    /**
     * 规划中项目数量。
     */
    @Schema(description = "规划中项目数量")
    private Long planning;

    /**
     * 进行中项目数量。
     */
    @Schema(description = "进行中项目数量")
    private Long inProgress;

    /**
     * 风险中项目数量。
     */
    @Schema(description = "风险中项目数量")
    private Long atRisk;

    /**
     * 已归档项目数量。
     */
    @Schema(description = "已归档项目数量")
    private Long archived;
}
