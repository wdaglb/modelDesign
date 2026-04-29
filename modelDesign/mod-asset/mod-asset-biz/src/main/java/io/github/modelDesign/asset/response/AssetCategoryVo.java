package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 设备分类视图对象。
 */
@Data
@Builder
@Schema(description = "设备分类视图对象")
public class AssetCategoryVo {
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
     * 分类名称。
     */
    @Schema(description = "分类名称")
    private String name;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort;

    /**
     * 状态，1 表示启用，0 表示停用。
     */
    @Schema(description = "状态，1 表示启用，0 表示停用")
    private Integer status;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    private String remark;
}
