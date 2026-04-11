package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 角色权限更新请求。
 */
@Data
@Schema(description = "角色权限更新请求")
public class RolePermissionUpdateRequest {

    /**
     * 菜单/按钮资源路径列表。
     *
     * 当前继续沿用 `menus` 字段名以兼容前端已有接口，
     * 但其中既包含菜单路径，也包含按钮路径。
     */
    @Schema(description = "菜单/按钮资源路径列表")
    private List<String> menus;
}
