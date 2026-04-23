package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新建盘点任务请求。
 */
@Data
@Schema(description = "新建盘点任务请求")
public class AssetStocktakeCreateRequest {
    /**
     * 任务名称。
     */
    @Schema(description = "任务名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "任务名称不能为空")
    @Size(max = 120, message = "任务名称长度不能超过 120 个字符")
    private String name;

    /**
     * 范围类型。
     */
    @Schema(description = "范围类型", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "范围类型不能为空")
    private Integer scopeType;

    /**
     * 范围位置 ID。
     */
    @Schema(description = "范围位置 ID")
    private Long scopeLocationId;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
