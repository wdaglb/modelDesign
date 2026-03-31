package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量修改角色状态请求。
 */
@Data
@Schema(description = "批量修改角色状态请求")
public class RoleBatchUpdateStatusRequest {
    /**
     * 角色 ID 列表。
     */
    @Schema(description = "角色 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "角色 ID 不能为空")
    private List<@NotNull(message = "角色 ID 不能为空") Long> ids;

    /**
     * 是否禁用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "角色状态不能为空")
    private Boolean isDisable;
}
