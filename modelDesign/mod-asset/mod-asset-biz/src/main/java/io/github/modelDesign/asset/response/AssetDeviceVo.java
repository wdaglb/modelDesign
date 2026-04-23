package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * 设备台账视图对象。
 */
@Data
@Builder
@Schema(description = "设备台账视图对象")
public class AssetDeviceVo {
    /**
     * 主键 ID。
     */
    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 所属租户 ID。
     */
    @Schema(description = "所属租户 ID")
    private Long tenantId;

    /**
     * 设备名称。
     */
    @Schema(description = "设备名称")
    private String deviceName;

    /**
     * 分类 ID。
     */
    @Schema(description = "分类 ID")
    private Long categoryId;

    /**
     * 资产编号。
     */
    @Schema(description = "资产编号")
    private String assetCode;

    /**
     * 序列号。
     */
    @Schema(description = "序列号")
    private String serialNumber;

    /**
     * 状态值。
     */
    @Schema(description = "状态值")
    private Integer status;

    /**
     * 位置 ID。
     */
    @Schema(description = "位置 ID")
    private Long locationId;

    /**
     * 当前使用人 ID。
     */
    @Schema(description = "当前使用人 ID")
    private Long currentUserId;

    /**
     * 购置日期。
     */
    @Schema(description = "购置日期")
    private LocalDate purchaseDate;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    private String remark;
}
