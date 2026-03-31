package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改角色状态请求。
 */
@Data
@Schema(description = "修改角色状态请求")
public class RoleUpdateStatusRequest {
    /**
     * 角色 ID。
     */
    @Schema(description = "角色 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "角色 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "角色状态不能为空")
    private Boolean isDisable;
}
