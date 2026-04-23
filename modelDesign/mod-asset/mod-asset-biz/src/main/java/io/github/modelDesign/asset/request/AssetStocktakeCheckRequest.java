package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 提交盘点结果请求。
 */
@Data
@Schema(description = "提交盘点结果请求")
public class AssetStocktakeCheckRequest {
    /**
     * 任务 ID。
     */
    @Schema(description = "任务 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "任务 ID 不能为空")
    private Long taskId;

    /**
     * 设备 ID。
     */
    @Schema(description = "设备 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "设备 ID 不能为空")
    private Long deviceId;

    /**
     * 盘点结果状态。
     */
    @Schema(description = "盘点结果状态")
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
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
