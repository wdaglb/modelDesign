package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量修改角色状态请求。
 */
@Data
public class RoleBatchUpdateStatusRequest {
    /**
     * 角色 ID 列表。
     */
    @NotEmpty(message = "角色 ID 不能为空")
    private List<@NotNull(message = "角色 ID 不能为空") Long> ids;

    /**
     * 是否禁用。
     */
    @NotNull(message = "角色状态不能为空")
    private Boolean isDisable;
}
