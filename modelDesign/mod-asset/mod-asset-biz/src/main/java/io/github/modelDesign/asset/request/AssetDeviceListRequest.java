package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 设备台账列表请求。
 */
@Data
@Schema(description = "设备台账列表请求")
public class AssetDeviceListRequest {
    /**
     * 当前页码。
     */
    @Schema(description = "当前页码")
    @Min(value = 1, message = "当前页码必须大于 0")
    private Integer current = 1;

    /**
     * 每页条数。
     */
    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数必须大于 0")
    private Integer pageSize = 10;

    /**
     * 设备名称关键字。
     */
    @Schema(description = "设备名称关键字")
    @Size(max = 100, message = "设备名称关键字长度不能超过 100 个字符")
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
    @Size(max = 64, message = "资产编号长度不能超过 64 个字符")
    private String assetCode;

    /**
     * 序列号。
     */
    @Schema(description = "序列号")
    @Size(max = 128, message = "序列号长度不能超过 128 个字符")
    private String serialNumber;

    /**
     * 状态。
     */
    @Schema(description = "状态")
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
}
