package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 删除菜单请求。
 */
@Data
@Schema(description = "删除菜单请求")
public class MenuDeleteRequest {
    /**
     * 待删除菜单 ID 列表。
     */
    @Schema(description = "待删除菜单 ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "删除菜单不能为空")
    private List<@NotNull(message = "菜单 ID 不能为空") Long> ids;
}
