package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 设备归还请求。
 */
@Data
@Schema(description = "设备归还请求")
public class AssetDeviceReturnRequest {
    /**
     * 设备 ID。
     */
    @Schema(description = "设备 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "设备 ID 不能为空")
    private Long id;

    /**
     * 归还后位置 ID。
     */
    @Schema(description = "归还后位置 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "归还位置不能为空")
    private Long locationId;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
