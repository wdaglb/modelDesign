package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 租户下拉选项。
 */
@Data
@Builder
@Schema(description = "租户下拉选项")
public class TenantOptionVo {
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
}
