package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 盘点明细视图对象。
 */
@Data
@Builder
@Schema(description = "盘点明细视图对象")
public class AssetStocktakeDetailVo {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID")
    private Long taskId;

    /**
     * 设备 ID。
     */
    @Schema(description = "设备 ID")
    private Long deviceId;

    /**
     * 结果状态。
     */
    @Schema(description = "结果状态")
    private Integer resultStatus;
}
