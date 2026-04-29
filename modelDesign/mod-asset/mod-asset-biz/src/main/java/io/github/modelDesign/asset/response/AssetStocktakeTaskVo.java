package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

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

    /**
     * 范围类型。
     */
    @Schema(description = "范围类型")
    private Integer scopeType;

    /**
     * 范围位置 ID。
     */
    @Schema(description = "范围位置 ID")
    private Long scopeLocationId;

    /**
     * 开始时间。
     */
    @Schema(description = "开始时间")
    private LocalDateTime startedAt;

    /**
     * 完成时间。
     */
    @Schema(description = "完成时间")
    private LocalDateTime finishedAt;

    /**
     * 任务备注。
     */
    @Schema(description = "任务备注")
    private String remark;

    /**
     * 创建人 ID。
     */
    @Schema(description = "创建人 ID")
    private Long createdUserId;

    /**
     * 盘点明细总数。
     */
    @Schema(description = "盘点明细总数")
    private Long totalCount;

    /**
     * 已登记盘点结果数量。
     */
    @Schema(description = "已登记盘点结果数量")
    private Long checkedCount;

    /**
     * 盘到数量。
     */
    @Schema(description = "盘到数量")
    private Long foundCount;

    /**
     * 未找到数量。
     */
    @Schema(description = "未找到数量")
    private Long missingCount;
}
