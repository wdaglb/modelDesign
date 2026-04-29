package io.github.modelDesign.asset.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑设备分类请求。
 */
@Data
@Schema(description = "编辑设备分类请求")
public class AssetCategoryEditRequest {
    /**
     * 分类名称。
     */
    @Schema(description = "分类名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 100, message = "分类名称长度不能超过 100 个字符")
    private String name;

    /**
     * 排序值。
     */
    @Schema(description = "排序值")
    private Integer sort = 1;

    /**
     * 状态，1 表示启用，0 表示停用。
     */
    @Schema(description = "状态，1 表示启用，0 表示停用")
    private Integer status = 1;

    /**
     * 备注。
     */
    @Schema(description = "备注")
    @Size(max = 500, message = "备注长度不能超过 500 个字符")
    private String remark;
}
