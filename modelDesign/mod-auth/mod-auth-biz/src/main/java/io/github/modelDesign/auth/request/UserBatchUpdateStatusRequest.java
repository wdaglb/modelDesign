package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量修改用户状态请求。
 *
 * 用于用户管理列表页中的批量启用/禁用操作。
 */
@Data
@Schema(description = "批量修改用户状态请求")
public class UserBatchUpdateStatusRequest {
    /**
     * 用户 ID 列表。
     *
     * 表示当前批量操作选中的全部用户。
     */
    @Schema(description = "用户 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "用户 ID 不能为空")
    private List<@NotNull(message = "用户 ID 不能为空") Long> ids;

    /**
     * 是否禁用。
     *
     * `true` 表示批量禁用，`false` 表示批量启用。
     */
    @Schema(description = "是否禁用", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "用户状态不能为空")
    private Boolean isDisable;
}
