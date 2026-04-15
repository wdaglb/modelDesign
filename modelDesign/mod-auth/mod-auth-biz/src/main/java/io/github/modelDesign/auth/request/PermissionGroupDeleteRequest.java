package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 删除权限资源组请求。
 */
@Data
@Schema(description = "删除权限资源组请求")
public class PermissionGroupDeleteRequest {
    /**
     * 资源组 ID。
     */
    @Schema(description = "资源组 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "资源组 ID 不能为空")
    private Long id;
}
