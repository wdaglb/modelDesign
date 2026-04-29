package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 设备分类删除前检查结果。
 */
@Data
@Builder
@Schema(description = "设备分类删除前检查结果")
public class AssetCategoryDeleteCheckVo {
    /**
     * 每个待删除分类的引用检查结果。
     */
    @Schema(description = "每个待删除分类的引用检查结果")
    private List<AssetCategoryDeleteCheckItemVo> items;

    /**
     * 待删除分类合计被设备引用的数量。
     */
    @Schema(description = "待删除分类合计被设备引用的数量")
    private Long totalReferenceCount;

    /**
     * 是否需要先迁移引用后再删除。
     */
    @Schema(description = "是否需要先迁移引用后再删除")
    private Boolean needTransfer;

    /**
     * 可选迁移目标分类列表。
     */
    @Schema(description = "可选迁移目标分类列表")
    private List<AssetOptionVo> transferOptions;
}
