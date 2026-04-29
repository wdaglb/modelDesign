package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 设备分类删除前检查请求。
 */
@Data
@Schema(description = "设备分类删除前检查请求")
public class AssetCategoryDeleteCheckRequest {
    /**
     * 待删除分类 ID 列表。
     */
    @Schema(
            description = "待删除分类 ID 列表",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    @NotEmpty(message = "待删除分类不能为空")
    private List<@NotNull(message = "分类 ID 不能为空") Long> ids;
}
