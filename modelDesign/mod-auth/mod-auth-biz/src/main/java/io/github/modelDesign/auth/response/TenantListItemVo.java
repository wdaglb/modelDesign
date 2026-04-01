package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 租户列表项。
 */
@Data
@Builder
@Schema(description = "租户列表项")
public class TenantListItemVo {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID")
    private Long id;

    /**
     * 租户编码。
     */
    @Schema(description = "租户编码")
    private String code;

    /**
     * 租户名称。
     */
    @Schema(description = "租户名称")
    private String name;

    /**
     * 租户描述。
     */
    @Schema(description = "租户描述")
    private String description;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用")
    private Boolean isDisable;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private String createdAt;

    /**
     * 更新时间。
     */
    @Schema(description = "更新时间")
    private String updatedAt;
}
