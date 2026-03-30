package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改角色状态请求。
 */
@Data
public class RoleUpdateStatusRequest {
    /**
     * 角色 ID。
     */
    @NotNull(message = "角色 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     */
    @NotNull(message = "角色状态不能为空")
    private Boolean isDisable;
}
