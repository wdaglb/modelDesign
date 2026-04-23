package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 资产下拉选项视图对象。
 */
@Data
@Builder
@Schema(description = "资产下拉选项视图对象")
public class AssetOptionVo {
    /**
     * 选项值。
     */
    @Schema(description = "选项值")
    private Long value;

    /**
     * 选项文本。
     */
    @Schema(description = "选项文本")
    private String label;
}
