package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 交换菜单排序请求。
 */
@Data
public class MenuSwapSortRequest {
    /**
     * 源菜单 ID。
     */
    @NotNull(message = "源菜单不能为空")
    private Long source;

    /**
     * 目标菜单 ID。
     */
    @NotNull(message = "目标菜单不能为空")
    private Long target;
}
