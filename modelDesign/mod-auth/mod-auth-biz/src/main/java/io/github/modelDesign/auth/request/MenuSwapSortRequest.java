package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 交换菜单排序请求。
 */
@Data
@Schema(description = "交换菜单排序请求")
public class MenuSwapSortRequest {
    /**
     * 源菜单 ID。
     */
    @Schema(description = "源菜单 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "源菜单不能为空")
    private Long source;

    /**
     * 目标菜单 ID。
     */
    @Schema(description = "目标菜单 ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "目标菜单不能为空")
    private Long target;
}
