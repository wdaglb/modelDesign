package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 盘点明细视图对象。
 */
@Data
@Builder
@Schema(description = "盘点明细视图对象")
public class AssetStocktakeDetailVo {
    /**
     * 明细 ID。
     */
    @Schema(description = "明细 ID")
    private Long id;

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
     * 设备名称。
     */
    @Schema(description = "设备名称")
    private String deviceName;

    /**
     * 资产编号。
     */
    @Schema(description = "资产编号")
    private String assetCode;

    /**
     * 设备状态。
     */
    @Schema(description = "设备状态")
    private Integer deviceStatus;

    /**
     * 账面数量。
     */
    @Schema(description = "账面数量")
    private Integer expectedQuantity;

    /**
     * 实际数量。
     */
    @Schema(description = "实际数量")
    private Integer actualQuantity;

    /**
     * 差异数量。
     */
    @Schema(description = "差异数量")
    private Integer differenceQuantity;

    /**
     * 账面位置 ID。
     */
    @Schema(description = "账面位置 ID")
    private Long expectedLocationId;

    /**
     * 账面使用人 ID。
     */
    @Schema(description = "账面使用人 ID")
    private Long expectedUserId;

    /**
     * 结果状态。
     */
    @Schema(description = "结果状态")
    private Integer resultStatus;

    /**
     * 实际位置 ID。
     */
    @Schema(description = "实际位置 ID")
    private Long actualLocationId;

    /**
     * 实际使用人 ID。
     */
    @Schema(description = "实际使用人 ID")
    private Long actualUserId;

    /**
     * 盘点人 ID。
     */
    @Schema(description = "盘点人 ID")
    private Long checkedUserId;

    /**
     * 盘点时间。
     */
    @Schema(description = "盘点时间")
    private LocalDateTime checkedAt;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    private String remark;
}
