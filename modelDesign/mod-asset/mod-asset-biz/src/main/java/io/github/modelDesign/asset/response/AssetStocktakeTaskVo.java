package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 盘点任务视图对象。
 */
@Data
@Builder
@Schema(description = "盘点任务视图对象")
public class AssetStocktakeTaskVo {
    /**
     * 主键 ID。
     */
    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 任务名称。
     */
    @Schema(description = "任务名称")
    private String name;

    /**
     * 状态值。
     */
    @Schema(description = "状态值")
    private Integer status;
}
