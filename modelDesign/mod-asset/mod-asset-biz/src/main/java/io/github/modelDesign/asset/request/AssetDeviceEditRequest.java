package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 设备台账编辑请求。
 */
@Data
@Schema(description = "设备台账编辑请求")
public class AssetDeviceEditRequest {
    /**
     * 设备名称。
     */
    @Schema(description = "设备名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "设备名称不能为空")
    @Size(max = 100, message = "设备名称长度不能超过 100 个字符")
    private String deviceName;

    /**
     * 分类 ID。
     */
    @Schema(description = "分类 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "设备分类不能为空")
    private Long categoryId;

    /**
     * 资产编号。
     */
    @Schema(description = "资产编号", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "资产编号不能为空")
    @Size(max = 64, message = "资产编号长度不能超过 64 个字符")
    private String assetCode;

    /**
     * 序列号。
     */
    @Schema(description = "序列号")
    @Size(max = 128, message = "序列号长度不能超过 128 个字符")
    private String serialNumber;

    /**
     * 位置 ID。
     */
    @Schema(description = "位置 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "存放位置不能为空")
    private Long locationId;

    /**
     * 购置日期。
     */
    @Schema(description = "购置日期")
    private LocalDate purchaseDate;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
