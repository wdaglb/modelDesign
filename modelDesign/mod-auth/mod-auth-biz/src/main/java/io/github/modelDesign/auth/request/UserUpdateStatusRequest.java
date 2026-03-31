package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改用户状态请求。
 *
 * 用于用户管理列表页中的单条启用/禁用操作。
 */
@Data
@Schema(description = "修改用户状态请求")
public class UserUpdateStatusRequest {
    /**
     * 用户 ID。
     *
     * 指定本次要修改状态的目标用户。
     */
    @Schema(description = "用户 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "用户 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     *
     * `true` 表示禁用，`false` 表示启用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "用户状态不能为空")
    private Boolean isDisable;
}
