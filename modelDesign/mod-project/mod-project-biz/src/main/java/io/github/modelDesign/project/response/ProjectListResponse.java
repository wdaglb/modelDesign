package io.github.modelDesign.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 项目列表响应。
 */
@Data
@Builder
@Schema(description = "项目列表响应")
public class ProjectListResponse {
    /**
     * 项目列表。
     */
    @Schema(description = "项目列表")
    private List<ProjectDetailVo> items;

    /**
     * 总条数。
     */
    @Schema(description = "总条数")
    private Long total;

    /**
     * 状态统计。
     */
    @Schema(description = "状态统计")
    private ProjectStatusSummaryVo statusSummary;

    /**
     * 项目分组选项。
     */
    @Schema(description = "项目分组选项")
    private List<String> groupOptions;
}
