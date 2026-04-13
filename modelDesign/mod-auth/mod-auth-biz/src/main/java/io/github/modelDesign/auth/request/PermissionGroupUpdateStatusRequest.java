package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 权限资源组状态更新请求。
 */
@Data
@Schema(description = "权限资源组状态更新请求")
public class PermissionGroupUpdateStatusRequest {
    /**
     * 资源组 ID。
     */
    @Schema(description = "资源组 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "资源组 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "是否禁用不能为空")
    private Boolean isDisable;
}
