package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改用户状态请求。
 *
 * 用于用户管理列表页中的单条启用/禁用操作。
 */
@Data
public class UserUpdateStatusRequest {
    /**
     * 用户 ID。
     *
     * 指定本次要修改状态的目标用户。
     */
    @NotNull(message = "用户 ID 不能为空")
    private Long id;

    /**
     * 是否禁用。
     *
     * `true` 表示禁用，`false` 表示启用。
     */
    @NotNull(message = "用户状态不能为空")
    private Boolean isDisable;
}
