package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 设备分类删除前检查项。
 */
@Data
@Builder
@Schema(description = "设备分类删除前检查项")
public class AssetCategoryDeleteCheckItemVo {
    /**
     * 分类 ID。
     */
    @Schema(description = "分类 ID")
    private Long id;

    /**
     * 分类名称。
     */
    @Schema(description = "分类名称")
    private String name;

    /**
     * 当前分类被设备引用的数量。
     */
    @Schema(description = "当前分类被设备引用的数量")
    private Long referenceCount;

    /**
     * 当前分类是否需要先迁移引用后再删除。
     */
    @Schema(description = "当前分类是否需要先迁移引用后再删除")
    private Boolean needTransfer;
}
