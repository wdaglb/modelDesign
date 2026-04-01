package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改租户状态请求。
 */
@Data
@Schema(description = "修改租户状态请求")
public class TenantUpdateStatusRequest {
    /**
     * 租户 ID。
     */
    @Schema(description = "租户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "租户 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "是否禁用不能为空")
    private Boolean isDisable;
}
