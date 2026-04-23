package io.github.modelDesign.asset.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 设备位置视图对象。
 */
@Data
@Builder
@Schema(description = "设备位置视图对象")
public class AssetLocationVo {
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
     * 位置名称。
     */
    @Schema(description = "位置名称")
    private String name;

    /**
     * 位置编码。
     */
    @Schema(description = "位置编码")
    private String code;

    /**
     * 父级位置 ID。
     */
    @Schema(description = "父级位置 ID")
    private Long parentId;
}
